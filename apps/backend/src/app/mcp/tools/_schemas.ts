import { z } from 'zod';

/**
 * Schemi zod riusabili per le tool input di authoring MCP.
 *
 * Vengono mantenuti volutamente "permissivi" sui campi opzionali (ammessi
 * `optional()` ovunque non strettamente obbligatorio) — la validazione
 * profonda è demandata al Mongoose schema in fase di save.
 */

export const HTTP_VERBS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const RESPONSE_TYPES = ['json', 'text', 'file', 'html'] as const;
export const PARAMETER_TARGETS = ['path', 'query', 'body', 'header'] as const;

export const ruleSchema = z.object({
  /** uuid v4 — opzionale in input, server-side se mancante. */
  id: z.string().optional(),
  expression: z.string().default(''),
  path: z.string().default(''),
  error: z.string().default(''),
  code: z.number().int().default(400),
});

export const parameterSchema = z.object({
  code: z.string(),
  name: z.string(),
  target: z.enum(PARAMETER_TARGETS),
  key: z.string().optional(),
  value: z.unknown().optional(),
});

export const callSchema = z.object({
  path: z.string(),
  verb: z.enum(HTTP_VERBS),
  description: z.string().optional(),
  response: z.string().optional(),
  file: z.string().optional(),
  respType: z.enum(RESPONSE_TYPES).optional(),
  rules: z.array(ruleSchema).optional(),
  body: z.string().optional(),
  parameters: z.array(parameterSchema).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  cookies: z.record(z.string(), z.string()).optional(),
});

/** Patch dei soli campi top-level scalari di un Service (no `calls`). */
export const serviceScalarPatch = {
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  path: z.string().min(1).optional(),
  active: z.boolean().optional(),
  dbo: z.string().optional(),
  schedulerFn: z.string().optional(),
  interval: z.number().int().nonnegative().optional(),
} as const;

/**
 * Patch dei soli campi scalari di una `IServiceCall` (no `rules`,
 * `parameters`, `headers`, `cookies` — modificati dai tool atomici di slice 7).
 */
export const callScalarPatch = {
  path: z.string().min(1).optional(),
  verb: z.enum(HTTP_VERBS).optional(),
  description: z.string().optional(),
  response: z.string().optional(),
  file: z.string().optional(),
  respType: z.enum(RESPONSE_TYPES).optional(),
  body: z.string().optional(),
} as const;
