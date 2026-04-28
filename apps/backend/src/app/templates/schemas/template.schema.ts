import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ITemplate, TemplateSource } from '@virtualservice/shared/model';
import {
  ServiceCall,
  ServiceCallSchema,
} from '../../services/schemas/service.schema';

export type TemplateDocument = HydratedDocument<Template>;

@Schema()
export class Template implements ITemplate {
  /** ID dell'utente che ha creato il template */
  @Prop({ required: true, index: true })
  ownerId!: string;

  /** Snapshot dell'email dell'autore al momento della creazione */
  @Prop({ required: true })
  ownerEmail!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [ServiceCallSchema], default: [] })
  calls!: ServiceCall[];

  @Prop({ default: '' })
  dbo?: string;

  @Prop({ default: '' })
  schedulerFn?: string;

  @Prop({ default: 0 })
  interval?: number;

  @Prop({ default: 0 })
  installs!: number;

  @Prop({ default: () => Date.now() })
  creationDate!: number;

  @Prop({ type: String, enum: ['community', 'system'], default: 'community' })
  source!: TemplateSource;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);
