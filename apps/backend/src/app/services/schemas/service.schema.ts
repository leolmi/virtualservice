import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  IService,
  IServiceCall,
  IServiceCallRule,
  IServiceCallParameter,
  HttpVerb,
  ResponseType,
  ParameterTarget,
} from '@virtualservice/shared/model';

// ---------------------------------------------------------------------------
// ServiceCallParameter
// ---------------------------------------------------------------------------

@Schema({ _id: false })
export class ServiceCallParameter implements IServiceCallParameter {
  /** Identificatore univoco del parametro (es. "path-id", "query-name") */
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  key!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['path', 'query', 'body', 'header'] satisfies ParameterTarget[],
  })
  target!: ParameterTarget;

  /** Valore di test nell'editor — tipo dinamico */
  @Prop({ type: MongooseSchema.Types.Mixed })
  value!: unknown;
}

export const ServiceCallParameterSchema =
  SchemaFactory.createForClass(ServiceCallParameter);

// ---------------------------------------------------------------------------
// ServiceCallRule
// ---------------------------------------------------------------------------

@Schema({ _id: false })
export class ServiceCallRule implements IServiceCallRule {
  /**
   * uuid v4 stabile assegnato al primo save dal pre-save hook su Service.
   * Usato dai tool MCP che modificano le rules per identità (non per indice).
   * Optional perché documenti pre-feature potrebbero non averlo.
   */
  @Prop({ type: String, default: undefined })
  id?: string;

  @Prop({ default: '' })
  expression!: string;

  @Prop({ default: '' })
  path!: string;

  @Prop({ default: '' })
  error!: string;

  /** Codice HTTP restituito quando la regola è soddisfatta (default 400) */
  @Prop({ default: 400 })
  code!: number;
}

export const ServiceCallRuleSchema =
  SchemaFactory.createForClass(ServiceCallRule);

// ---------------------------------------------------------------------------
// ServiceCall
// ---------------------------------------------------------------------------

@Schema({ _id: false })
export class ServiceCall implements IServiceCall {
  @Prop({ required: true })
  path!: string;

  @Prop({
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] satisfies HttpVerb[],
    default: 'GET',
  })
  verb!: HttpVerb;

  @Prop({ default: '' })
  description!: string;

  /** Codice JS (stringa-js) che genera la risposta */
  @Prop({ default: '' })
  response!: string;

  /** Path del file locale per il download (usato con respType === 'file') */
  @Prop({ default: '' })
  file!: string;

  @Prop({
    type: String,
    enum: ['json', 'text', 'file', 'html'] satisfies ResponseType[],
    default: 'json',
  })
  respType!: ResponseType;

  @Prop({ type: [ServiceCallRuleSchema], default: [] })
  rules!: ServiceCallRule[];

  /** Body della request usato esclusivamente in fase di test nell'editor */
  @Prop({ default: '' })
  body!: string;

  @Prop({ type: [ServiceCallParameterSchema], default: [] })
  parameters!: ServiceCallParameter[];

  /** Header HTTP da aggiungere alla risposta */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  headers!: Record<string, string>;

  /** Cookie da impostare nella risposta */
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  cookies!: Record<string, string>;

  /**
   * Se true la call viene esclusa dalla pagina pubblica di discovery.
   * Non influisce sull'esecuzione runtime.
   */
  @Prop({ default: false })
  unlisted!: boolean;
}

export const ServiceCallSchema = SchemaFactory.createForClass(ServiceCall);

// ---------------------------------------------------------------------------
// Service (documento radice)
// ---------------------------------------------------------------------------

export type ServiceDocument = HydratedDocument<Service>;

@Schema()
export class Service implements IService {
  /** ID dell'utente proprietario */
  @Prop({ required: true, index: true })
  owner!: string;

  @Prop({ default: () => Date.now() })
  lastChange!: number;

  @Prop({ default: () => Date.now() })
  creationDate!: number;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  description!: string;

  @Prop({ default: false })
  starred!: boolean;

  @Prop({ default: true })
  active!: boolean;

  /** Codice JS (stringa-js) che descrive la struttura dati in-memory */
  @Prop({ default: '' })
  dbo!: string;

  /** Segmento di path univoco tra tutti i servizi — indice unico */
  @Prop({ required: true, unique: true })
  path!: string;

  @Prop({ type: [ServiceCallSchema], default: [] })
  calls!: ServiceCall[];

  /** Codice JS (stringa-js) eseguito periodicamente per aggiornare il dbo */
  @Prop({ default: '' })
  schedulerFn!: string;

  /** Frequenza di esecuzione di schedulerFn in secondi (0 = disabilitato) */
  @Prop({ default: 0 })
  interval!: number;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);

// Aggiorna lastChange automaticamente ad ogni salvataggio.
// Backfilla `id` su ogni rule che ne è priva (uuid v4) — migrazione naturale
// idempotente. I documenti pre-feature acquisiscono ids al primo save (UI o MCP).
// Rifiuta i save che contengono call duplicate (stesso `verb` + `path`): a
// runtime il mock-server serve solo la prima occorrenza, le successive sono
// codice morto. Il bootstrap dedup ripulisce lo storico (vedi
// `services-dedup.bootstrap.ts`); questo guard impedisce di reintrodurle.
ServiceSchema.pre('save', function (next) {
  this.lastChange = Date.now();

  const seen = new Set<string>();
  for (const call of this.calls ?? []) {
    const key = `${call.verb}:${call.path}`;
    if (seen.has(key)) {
      return next(
        new Error(
          `Duplicate call definition: a call with verb "${call.verb}" and path "${call.path}" already exists in this service.`,
        ),
      );
    }
    seen.add(key);
    for (const rule of call.rules ?? []) {
      if (!rule.id) {
        rule.id = randomUUID();
      }
    }
  }
  next();
});
