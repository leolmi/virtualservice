import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CreateTemplateDto,
  InstallTemplateDto,
} from '@virtualservice/shared/dto';
import { Template, TemplateDocument } from './schemas/template.schema';
import { Service, ServiceDocument } from '../services/schemas/service.schema';
import { UsersService } from '../users/users.service';

const DEFAULT_EXPRESSION_SIZE_LIMIT = 64 * 1024;

interface ExpressionViolation {
  field: string;
  size: number;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);
  private readonly expressionSizeLimit: number;

  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly usersService: UsersService,
    configService: ConfigService,
  ) {
    const envLimit = configService.get<string>(
      'VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT',
    );
    this.expressionSizeLimit = envLimit
      ? parseInt(envLimit, 10)
      : DEFAULT_EXPRESSION_SIZE_LIMIT;
  }

  /** Lista pubblica dei template (tutti gli utenti autenticati possono vederla) */
  async findAll(): Promise<TemplateDocument[]> {
    return this.templateModel
      .find()
      .sort({ creationDate: -1 })
      .exec();
  }

  /** Dettaglio di un template per id */
  async findOne(id: string): Promise<TemplateDocument> {
    const tpl = await this.templateModel.findById(id).exec();
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  /** Crea un nuovo template (immutabile dopo la creazione) */
  async create(
    userId: string,
    dto: CreateTemplateDto,
  ): Promise<TemplateDocument> {
    if (!Array.isArray(dto.calls) || dto.calls.length === 0) {
      throw new BadRequestException('Seleziona almeno una call');
    }

    this.validateExpressionSizes(dto);

    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return this.templateModel.create({
      ownerId: userId,
      ownerEmail: user.email,
      title: dto.title.trim(),
      description: dto.description,
      tags: dto.tags ?? [],
      calls: dto.calls,
      dbo: dto.dbo ?? '',
      schedulerFn: dto.schedulerFn ?? '',
      interval: dto.interval ?? 0,
      installs: 0,
      creationDate: Date.now(),
    });
  }

  /** Elimina un template (solo l'autore o un admin) */
  async remove(id: string, userId: string, role?: string): Promise<void> {
    const tpl = await this.templateModel.findById(id).exec();
    if (!tpl) throw new NotFoundException('Template not found');
    if (role !== 'admin' && tpl.ownerId !== userId) {
      throw new ForbiddenException();
    }
    await this.templateModel.findByIdAndDelete(id).exec();
  }

  /**
   * Installa un template creando un nuovo servizio per l'utente corrente.
   * Il path è scelto dall'utente (deve essere globalmente unico).
   */
  async install(
    id: string,
    userId: string,
    dto: InstallTemplateDto,
  ): Promise<ServiceDocument> {
    const tpl = await this.templateModel.findById(id).exec();
    if (!tpl) throw new NotFoundException('Template not found');

    const path = (dto.path ?? '').trim();
    if (!path) throw new BadRequestException('Il path è obbligatorio');

    const existing = await this.serviceModel.findOne({ path }).exec();
    if (existing) throw new ConflictException('Path già in uso');

    const now = Date.now();
    const service = await this.serviceModel.create({
      owner: userId,
      name: dto.name?.trim() || tpl.title,
      description: tpl.description,
      starred: false,
      active: true,
      path,
      dbo: tpl.dbo ?? '',
      schedulerFn: tpl.schedulerFn ?? '',
      interval: tpl.interval ?? 0,
      calls: tpl.calls,
      creationDate: now,
      lastChange: now,
    });

    await this.templateModel
      .updateOne({ _id: tpl._id }, { $inc: { installs: 1 } })
      .exec();

    return service;
  }

  /**
   * Valida la dimensione dei campi espressione del template.
   * Stessa logica usata in ServicesService per la coerenza.
   */
  private validateExpressionSizes(dto: CreateTemplateDto): void {
    const limit = this.expressionSizeLimit;
    const violations: ExpressionViolation[] = [];

    const checkField = (value: unknown, field: string): void => {
      if (typeof value === 'string' && Buffer.byteLength(value, 'utf8') > limit) {
        violations.push({ field, size: Buffer.byteLength(value, 'utf8') });
      }
    };

    checkField(dto.schedulerFn, 'schedulerFn');
    checkField(dto.dbo, 'dbo');

    dto.calls.forEach((call, ci) => {
      checkField(call.response, `calls[${ci}].response`);
      (call.rules ?? []).forEach((rule, ri) => {
        checkField(rule.expression, `calls[${ci}].rules[${ri}].expression`);
      });
    });

    if (violations.length > 0) {
      const details = violations
        .map((v) => `${v.field} (${v.size} bytes)`)
        .join(', ');
      this.logger.warn(`Template expression size limit exceeded: ${details}`);
      throw new BadRequestException(
        `Expression size limit exceeded (max ${limit} bytes): ${details}`,
      );
    }
  }
}
