import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';
import { ILog } from '@virtualservice/shared/model';

@Injectable()
export class LogService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<LogDocument>,
  ) {}

  /** Inserisce una nuova riga di log */
  async create(data: ILog): Promise<void> {
    await this.logModel.create(data);
  }

  /**
   * Restituisce i log per un servizio specifico.
   * @param serviceId  ID del servizio
   * @param ownerId    Deve corrispondere all'owner del servizio (sicurezza)
   * @param last       Se fornito, include solo i log con time >= last
   */
  async findByService(
    serviceId: string,
    ownerId: string,
    last?: number,
    role?: string,
  ): Promise<LogDocument[]> {
    const filter: Record<string, unknown> = { serviceId };
    if (role !== 'admin') {
      filter['owner'] = ownerId;
    }
    if (last !== undefined) {
      filter['time'] = { $gte: last };
    }
    return this.logModel.find(filter).sort({ time: -1 }).exec();
  }

  /** Elimina tutti i log dell'utente (usato da DELETE /services) */
  async deleteByOwner(ownerId: string): Promise<void> {
    await this.logModel.deleteMany({ owner: ownerId }).exec();
  }
}
