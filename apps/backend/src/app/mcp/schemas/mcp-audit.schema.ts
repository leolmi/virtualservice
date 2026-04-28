import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type McpAuditDocument = HydratedDocument<McpAudit>;

/**
 * Riga di audit log per ogni **mutation** MCP eseguita.
 *
 * Le read non vengono registrate (riducono noise senza valore investigativo).
 * Argomenti troncati a `MCP_AUDIT_MAX_ARGS_BYTES` (4KB) per non gonfiare la
 * collection con payload grandi (es. response da 64KB inclusi).
 *
 * **TTL 30gg** sull'index `ts`. Mantenimento solo per debug recente.
 */
@Schema({ timestamps: { createdAt: false, updatedAt: false } })
export class McpAudit {
  @Prop({ required: true, index: true })
  userId!: string;

  /** ID dell'API key utilizzata per la chiamata MCP. */
  @Prop({ required: true })
  keyId!: string;

  /** Nome del tool invocato (es. `update_service`, `delete_service`). */
  @Prop({ required: true })
  tool!: string;

  /** Args della tool call, troncati se sopra il limite (vedi `argsTruncated`). */
  @Prop({ type: MongooseSchema.Types.Mixed })
  args!: unknown;

  /** True se `args` è stata troncata. */
  @Prop({ default: false })
  argsTruncated!: boolean;

  /** Esito della tool call. */
  @Prop({ required: true })
  success!: boolean;

  /** Codice errore strutturato MCP (popolato solo se `success === false`). */
  @Prop({ type: String, default: null })
  errorCode!: string | null;

  /** Timestamp di registrazione (usato anche dal TTL). */
  @Prop({ type: Date, default: () => new Date() })
  ts!: Date;
}

export const McpAuditSchema = SchemaFactory.createForClass(McpAudit);

// TTL — Mongo elimina le righe oltre 30gg.
McpAuditSchema.index({ ts: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
