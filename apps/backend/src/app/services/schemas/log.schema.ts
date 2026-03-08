import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type LogDocument = HydratedDocument<Log>;

@Schema({ collection: 'logs', timestamps: false })
export class Log extends Document {
  /** Timestamp Unix (ms) al momento della ricezione della richiesta */
  @Prop({ required: true, index: true })
  time!: number;

  /** ID dell'utente owner del servizio */
  @Prop({ required: true, index: true })
  owner!: string;

  /** ID del servizio, usato per le query di monitoring */
  @Prop({ required: true, index: true })
  serviceId!: string;

  /** Errore emesso durante l'elaborazione (se presente) */
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  error!: unknown;

  /** Snapshot della ServiceCall al momento della richiesta */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  call!: unknown;

  /** Dati serializzabili della request (method, path, query, body, headers) */
  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  request!: unknown;

  /** Dati serializzabili della response (status, body) */
  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  response!: unknown;

  /** Tempo di esecuzione in ms */
  @Prop({ default: null })
  elapsed!: number | null;
}

export const LogSchema = SchemaFactory.createForClass(Log);
