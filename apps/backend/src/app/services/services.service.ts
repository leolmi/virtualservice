import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, isValidObjectId } from 'mongoose';
import { Service, ServiceDocument } from './schemas/service.schema';
import { ServiceCacheService } from '../mock-server/service-cache.service';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name)
    private readonly serviceModel: Model<ServiceDocument>,
    private readonly cacheService: ServiceCacheService,
  ) {}

  /** Restituisce tutti i servizi dell'utente */
  async findAll(ownerId: string): Promise<ServiceDocument[]> {
    return this.serviceModel.find({ owner: ownerId }).sort({ lastChange: -1 }).exec();
  }

  /** Restituisce un servizio per id (solo se l'owner corrisponde) */
  async findOne(id: string, ownerId: string): Promise<ServiceDocument> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (service.owner !== ownerId) throw new ForbiddenException();
    return service;
  }

  /**
   * Upsert: se il body contiene _id e il documento esiste con quell'owner → aggiorna,
   * altrimenti inserisce come nuovo servizio.
   */
  async save(
    dto: Record<string, unknown>,
    ownerId: string,
  ): Promise<ServiceDocument> {
    const existingId = dto['_id'] as string | undefined;

    if (existingId && isValidObjectId(existingId)) {
      const existing = await this.serviceModel.findById(existingId).exec();
      if (existing && existing.owner === ownerId) {
        // Aggiornamento: escludiamo i campi immutabili
        const { _id, owner, creationDate, ...updateData } = dto;
        void _id; void owner; void creationDate;
        Object.assign(existing, updateData);
        existing.lastChange = Date.now();
        return existing.save();
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

  /** Elimina un servizio (solo se l'owner corrisponde) */
  async remove(id: string, ownerId: string): Promise<void> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (service.owner !== ownerId) throw new ForbiddenException();

    this.cacheService.clearService(id);
    await this.serviceModel.findByIdAndDelete(id).exec();
  }

  /**
   * Restart: resetta il dbo in cache e riavvia lo schedulerFn.
   * La prossima chiamata al servizio lo reinizializzerà automaticamente.
   */
  async restart(id: string, ownerId: string): Promise<void> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) throw new NotFoundException('Service not found');
    if (service.owner !== ownerId) throw new ForbiddenException();

    // Cancella la cache (timer + db) e reinizializza immediatamente
    this.cacheService.clearService(id);
    await this.cacheService.initIfNeeded(service);
  }
}
