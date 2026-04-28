import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ServiceSnapshot,
  ServiceSnapshotDocument,
} from './schemas/service-snapshot.schema';
import { ServicesService } from '../services/services.service';

/** Soglia di freschezza per la cattura: snapshot più recenti vengono preservati. */
export const SNAPSHOT_THRESHOLD_MS = 60 * 60 * 1000; // 1h

interface SnapshotPublic {
  id: string;
  serviceId: string;
  tool: string;
  args: unknown;
  content: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Gestisce gli snapshot di service pre-mutation MCP.
 *
 * Pattern d'uso dalle tool callback:
 * ```ts
 * await deps.snapshotService.captureBeforeMutation(userId, serviceId, 'update_service', args);
 * await deps.servicesService.save(...);
 * ```
 */
@Injectable()
export class SnapshotService {
  private readonly logger = new Logger(SnapshotService.name);

  constructor(
    @InjectModel(ServiceSnapshot.name)
    private readonly snapshotModel: Model<ServiceSnapshotDocument>,
    private readonly servicesService: ServicesService,
  ) {}

  /**
   * Cattura lo stato corrente del service prima di una mutation, **solo se**
   * non c'è già uno snapshot più recente di `SNAPSHOT_THRESHOLD_MS`.
   * Se il service non esiste (o non è dell'utente) la chiamata è no-op.
   */
  async captureBeforeMutation(
    userId: string,
    serviceId: string,
    tool: string,
    args: unknown,
  ): Promise<void> {
    try {
      const existing = await this.snapshotModel
        .findOne({ userId, serviceId })
        .sort({ createdAt: -1 })
        .exec();
      if (existing) {
        const ageMs = Date.now() - existing.get('createdAt').getTime();
        if (ageMs < SNAPSHOT_THRESHOLD_MS) {
          // Snapshot di sessione recente — non sovrascriviamo.
          return;
        }
      }

      let content: Record<string, unknown>;
      try {
        const service = await this.servicesService.findOne(serviceId, userId);
        content = service.toObject() as unknown as Record<string, unknown>;
      } catch (err) {
        // Service non esiste o non è dell'utente — niente snapshot da fare.
        const name = (err as { name?: string }).name;
        if (name === 'NotFoundException' || name === 'ForbiddenException') {
          return;
        }
        throw err;
      }

      // Sostituisci atomicamente: niente cleanup separato, evitiamo race.
      await this.snapshotModel.findOneAndUpdate(
        { userId, serviceId },
        {
          $set: {
            userId,
            serviceId,
            tool,
            args,
            content,
            createdAt: new Date(),
          },
        },
        { upsert: true, new: true },
      );
    } catch (err) {
      // Non bloccare la mutation se lo snapshot fallisce. Notifichiamo solo.
      this.logger.warn(
        `Failed to capture snapshot for service ${serviceId}: ${(err as Error).message}`,
      );
    }
  }

  /** Lista degli snapshot per un service dell'utente. Al massimo 1 entry. */
  async list(userId: string, serviceId: string): Promise<SnapshotPublic[]> {
    const docs = await this.snapshotModel
      .find({ userId, serviceId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => this.toPublic(d));
  }

  /**
   * Ripristina uno snapshot. Sostituisce il contenuto del service originale
   * (per `_id`) tramite `ServicesService.save`. Se il service è stato
   * eliminato, viene re-inserito con un nuovo `_id` (path del backup deve
   * essere ancora libero, altrimenti errore di unique).
   */
  async restore(
    snapshotId: string,
    userId: string,
    role?: string,
  ): Promise<{ snapshotId: string; restoredServiceId: string }> {
    const snap = await this.snapshotModel.findById(snapshotId).exec();
    if (!snap) {
      throw new NotFoundException('Snapshot not found');
    }
    if (snap.userId !== userId && role !== 'admin') {
      throw new NotFoundException('Snapshot not found');
    }

    // Forziamo l'_id originale: se il service esiste è update, altrimenti
    // ServicesService.save inserisce nuovo (con _id pulito).
    const dto: Record<string, unknown> = { ...snap.content, _id: snap.serviceId };
    const restored = await this.servicesService.save(dto, userId, role);
    return {
      snapshotId,
      restoredServiceId: String(restored._id),
    };
  }

  private toPublic(doc: ServiceSnapshotDocument): SnapshotPublic {
    const obj = doc.toObject() as {
      createdAt?: Date;
      tool?: string;
      args?: unknown;
      content?: Record<string, unknown>;
      serviceId?: string;
    };
    return {
      id: String(doc._id),
      serviceId: obj.serviceId ?? '',
      tool: obj.tool ?? 'unknown',
      args: obj.args ?? {},
      content: obj.content ?? {},
      createdAt: obj.createdAt ?? new Date(),
    };
  }
}
