import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiKeyDocument = HydratedDocument<ApiKey>;

/**
 * Mongoose model dell'API key.
 *
 * La shape verso il frontend è `IApiKeyPublic` da `@virtualservice/shared/model`
 * — questa classe usa convenzioni Mongoose (es. `Date | null`) e va sempre
 * convertita esplicitamente prima di uscire dal backend (vedi `toPublic`).
 */
@Schema({ timestamps: true })
export class ApiKey {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  name!: string;

  /**
   * Primi 8 caratteri del segreto. Identifica la key in modo univoco
   * (alphabet base64url, ~62^8 = ~2.18e14 combinazioni).
   */
  @Prop({ required: true, unique: true, index: true })
  prefix!: string;

  /** sha256 hex della stringa completa `vsk_<prefix>_<secret>` */
  @Prop({ required: true })
  hash!: string;

  @Prop({ type: [String], default: ['*'] })
  scopes!: string[];

  @Prop({ type: Date, default: null })
  lastUsedAt!: Date | null;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);
