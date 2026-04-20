import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, isValidObjectId } from 'mongoose';
import * as _ from 'lodash';
import { Service, ServiceDocument } from './schemas/service.schema';
import { ServiceCacheService } from '../mock-server/service-cache.service';
import { CalcResult } from '../mock-server/interfaces/scope.interface';
import calc from '../mock-server/workers/calc';
import { TestCallDto, TestCallResult } from '@virtualservice/shared/dto';

/** Default 64 KB per singolo campo espressione */
const DEFAULT_EXPRESSION_SIZE_LIMIT = 64 * 1024;

interface ExpressionViolation {
  field: string;
  size: number;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  private readonly expressionSizeLimit: number;

  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly cacheService: ServiceCacheService,
    private readonly configService: ConfigService,
  ) {
    const envLimit = this.configService.get<string>('VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT');
    this.expressionSizeLimit = envLimit
      ? parseInt(envLimit, 10)
      : DEFAULT_EXPRESSION_SIZE_LIMIT;
  }

  /** Restituisce tutti i servizi dell'utente */
  async findAll(ownerId: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ owner: ownerId }).sort({ lastChange: -1 }).exec();
  }

  /** Restituisce un servizio per id (solo se l'owner corrisponde, admin bypassa) */
  async findOne(id: string, ownerId: string, role?: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (role !== 'admin' && service.owner !== ownerId) throw new ForbiddenException();
    return service;
  }

  /**
   * Upsert: se il body contiene _id e il documento esiste con quell'owner → aggiorna,
   * altrimenti inserisce come nuovo servizio.
   */
  async save(
    dto: Record<string, unknown>,
    ownerId: string,
    role?: string,
  ): Promise<ServiceDocument> {
    this.validateExpressionSizes(dto);

    const existingId = dto['_id'] as string | undefined;

    if (existingId && isValidObjectId(existingId)) {
      const existing = await this.serviceModel.findById(existingId).exec();
      if (existing && (role === 'admin' || existing.owner === ownerId)) {
        // Aggiornamento: escludiamo i campi immutabili
        const { _id, owner, creationDate, ...updateData } = dto;
        void _id; void owner; void creationDate;
        Object.assign(existing, updateData);
        existing.lastChange = Date.now();
        const saved = await existing.save();

        // Pulisce la cache (ferma il timer scheduler se attivo).
        // La prossima request reinizializzerà il servizio con i nuovi valori.
        this.cacheService.clearService(existingId);

        return saved;
      }
    }

    // Inserimento nuovo servizio
    return this.serviceModel.create({
      ...dto,
      _id: undefined,
      owner: ownerId,
      creationDate: Date.now(),
      lastChange: Date.now(),
    });
  }

  /** Verifica che il path non sia già usato da un altro servizio (escluso quello corrente) */
  async isPathAvailable(
    path: string,
    excludeServiceId?: string,
  ): Promise<{ available: boolean }> {
    const query: FilterQuery<ServiceDocument> = { path };
    if (excludeServiceId && isValidObjectId(excludeServiceId)) {
      query['_id'] = { $ne: excludeServiceId };
    }
    const existing = await this.serviceModel.findOne(query).exec();
    return { available: !existing };
  }

  /** Elimina un servizio (solo se l'owner corrisponde, admin bypassa) */
  async remove(id: string, ownerId: string, role?: string): Promise<void> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (role !== 'admin' && service.owner !== ownerId) throw new ForbiddenException();

    this.cacheService.clearService(id);
    await this.serviceModel.findByIdAndDelete(id).exec();
  }

  /**
   * Restart: resetta il dbo in cache e riavvia lo schedulerFn.
   * La prossima chiamata al servizio lo reinizializzerà automaticamente.
   */
  async restart(id: string, ownerId: string, role?: string): Promise<void> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (role !== 'admin' && service.owner !== ownerId) throw new ForbiddenException();

    // Cancella la cache (timer + db) e reinizializza immediatamente
    this.cacheService.clearService(id);
    await this.cacheService.initIfNeeded(service);
  }

  /** Esegue il test di una call usando la definizione corrente (non ancora persistita) */
  async testCall(dto: TestCallDto, ownerId: string, role?: string): Promise<TestCallResult> {
    const service = await this.serviceModel.findById(dto.serviceId).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (role !== 'admin' && service.owner !== ownerId) throw new ForbiddenException();

    const db = await this.cacheService.initIfNeeded(service);

    const scope: Record<string, unknown> = {
      params: dto.params ?? {},
      data: dto.body ?? null,
      db,
      headers: dto.headers ?? {},
      cookies: dto.cookies ?? {},
      pathValue: dto.pathValues ?? {},
    };

    const isBodyVerb = ['POST', 'PUT', 'PATCH'].includes(dto.call.verb.toUpperCase());
    const ruleData = isBodyVerb ? (dto.body ?? {}) : (dto.params ?? {});

    for (const rule of dto.call.rules) {
      let ruleResult: CalcResult;
      try {
        const ruleScope = { ...scope, value: _.get(ruleData as object, rule.path) };
        ruleResult = await calc(rule.expression, ruleScope);
      } catch (err) {
        this.logger.error('Errore nella valutazione della regola:', err);
        continue;
      }
      if (ruleResult.db) {
        this.cacheService.updateDb(dto.serviceId, ruleResult.db);
        scope['db'] = ruleResult.db;
      }
      if (ruleResult.error) continue;
      if (ruleResult.value === true) {
        return { statusCode: rule.code, body: { error: rule.error } };
      }
    }

    let respResult: CalcResult;
    try {
      respResult = await calc(dto.call.response, scope);
    } catch (err) {
      return { statusCode: 500, body: { error: String(err) } };
    }

    if (respResult.db) {
      this.cacheService.updateDb(dto.serviceId, respResult.db);
    }

    if (respResult.error) {
      return { statusCode: 500, body: { error: String(respResult.error) } };
    }

    return { statusCode: 200, body: respResult.value };
  }

  /**
   * Valida la dimensione dei campi espressione nel DTO.
   * Campi controllati: schedulerFn, dbo, calls[].response, calls[].rules[].expression
   * Lancia BadRequestException se un campo supera il limite.
   */
  private validateExpressionSizes(dto: Record<string, unknown>): void {
    const limit = this.expressionSizeLimit;
    const violations: ExpressionViolation[] = [];

    const checkField = (value: unknown, field: string): void => {
      if (typeof value === 'string' && Buffer.byteLength(value, 'utf8') > limit) {
        violations.push({ field, size: Buffer.byteLength(value, 'utf8') });
      }
    };

    // Campi a livello di servizio
    checkField(dto['schedulerFn'], 'schedulerFn');
    checkField(dto['dbo'], 'dbo');

    // Campi nelle calls
    const calls = dto['calls'];
    if (Array.isArray(calls)) {
      calls.forEach((call: Record<string, unknown>, ci: number) => {
        checkField(call['response'], `calls[${ci}].response`);

        const rules = call['rules'];
        if (Array.isArray(rules)) {
          rules.forEach((rule: Record<string, unknown>, ri: number) => {
            checkField(rule['expression'], `calls[${ci}].rules[${ri}].expression`);
          });
        }
      });
    }

    if (violations.length > 0) {
      const details = violations
        .map((v) => `${v.field} (${v.size} bytes)`)
        .join(', ');
      this.logger.warn(`Expression size limit exceeded: ${details}`);
      throw new BadRequestException(
        `Expression size limit exceeded (max ${limit} bytes): ${details}`,
      );
    }
  }
}
