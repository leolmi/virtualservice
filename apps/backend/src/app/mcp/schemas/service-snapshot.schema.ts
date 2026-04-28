import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ServiceSnapshotDocument = HydratedDocument<ServiceSnapshot>;

/**
 * Snapshot di un service prima di una mutation MCP.
 *
 * Logica applicativa (gestita in `SnapshotService`):
 * - **1 slot per (userId, serviceId)**: nuove mutation possono sovrascrivere
 *   l'esistente solo se quello attuale ha più di `SNAPSHOT_THRESHOLD_MS` (1h).
 *   Sotto la threshold lo snapshot resta come "stato di inizio sessione".
 * - **TTL 24h**: l'index TTL su `createdAt` rimuove gli snapshot più vecchi.
 *
 * Il campo `content` ospita lo stato del service completo come oggetto JS
 * (output di `ServiceDocument.toObject()`), incluso `_id`. Mantenuto come
 * `Mixed` per non duplicare lo schema Service e per essere robusto a future
 * variazioni di forma.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ServiceSnapshot {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true, index: true })
  serviceId!: string;

  /** Tool MCP che ha innescato la cattura (es. `update_service`, `delete_service`). */
  @Prop({ required: true })
  tool!: string;

  /** Args della tool call al momento della cattura. */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  args!: unknown;

  /** Snapshot completo del service pre-modifica. */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content!: Record<string, unknown>;
}

export const ServiceSnapshotSchema = SchemaFactory.createForClass(ServiceSnapshot);

// TTL — Mongo elimina automaticamente gli snapshot più vecchi di 24h.
ServiceSnapshotSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 24 * 60 * 60 },
);

// Lookup veloce dell'unico slot per (userId, serviceId)
ServiceSnapshotSchema.index({ userId: 1, serviceId: 1 });
