import {
  IService,
  IServiceCall,
  IServiceCallParameter,
  IServiceCallRule,
  HttpVerb,
  ResponseType,
} from '@virtualservice/shared/model';
import {
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
} from './file-parser';

/**
 * Converte un `ParsedImport` (output di `OpenApiParser.parse(content)`) in
 * un singolo `IService` pronto per essere salvato.
 *
 * Differenze rispetto al converter del frontend (`apps/frontend/.../import-converter.ts`):
 * - **Sempre un singolo service**: tutte le operations da tutti i gruppi
 *   confluiscono in un'unica `IService.calls`. La separazione per tag che
 *   il parser produce naturalmente in più `groups` viene appiattita —
 *   l'agente MCP che vuole servizi separati può fare clone successivi.
 * - **Niente VirtualService native source**: questo converter è OpenAPI-only.
 * - **Base64 portabile**: usa `Buffer.from(...).toString('base64')` invece
 *   di `btoa()` (disponibile sia in Node che in browser, ma più esplicito).
 */

const SUPPORTED_VERBS = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

function toExpressPath(p: string): string {
  return p.replace(/\{(\w+)}/g, ':$1');
}

function toRespType(contentType: string): ResponseType {
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('html')) return 'html';
  if (contentType.includes('octet-stream') || contentType.includes('pdf')) return 'file';
  return 'text';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Encode a UTF-8 string to base64. Works in both Node (`Buffer`) and browser
 * (`btoa` after UTF-8 → byte conversion). Lib `shared/utils` is consumed by
 * both apps, so we can't rely on either alone.
 */
function b64(s: string): string {
  const g = globalThis as unknown as {
    Buffer?: { from(s: string, enc: string): { toString(enc: string): string } };
    btoa?: (s: string) => string;
  };
  if (g.Buffer) {
    return g.Buffer.from(s, 'utf8').toString('base64');
  }
  if (g.btoa) {
    return g.btoa(unescape(encodeURIComponent(s)));
  }
  throw new Error('No base64 encoder available in this environment');
}

function stubResponse(op: ParsedOperation): string {
  const successCodes = Object.keys(op.responses).filter((c) => c.startsWith('2'));
  const desc =
    successCodes.length > 0 ? op.responses[successCodes[0]] : 'OK';

  if (op.responseContentType.includes('json')) {
    return b64(`(req, dbo) => ({ message: ${JSON.stringify(desc || 'OK')} })`);
  }
  return b64(`(req, dbo) => ${JSON.stringify(desc || 'OK')}`);
}

function toCallParameters(params: ParsedParameter[]): IServiceCallParameter[] {
  return params.map((p, i) => ({
    code: `p${i}`,
    name: p.name,
    target: p.target,
    key: p.target === 'query' ? p.name : undefined,
    value: p.example ?? '',
  }));
}

function bodySchemaToParameters(
  schema: Record<string, unknown> | undefined,
  startIndex: number,
): IServiceCallParameter[] {
  if (!schema) return [];
  const props =
    typeof schema['properties'] === 'object' && schema['properties'] !== null
      ? (schema['properties'] as Record<string, unknown>)
      : {};
  return Object.entries(props).map(([name, def], i) => {
    const field =
      typeof def === 'object' && def !== null
        ? (def as Record<string, unknown>)
        : {};
    return {
      code: `p${startIndex + i}`,
      name,
      target: 'body' as const,
      value: field['example'] ?? field['default'] ?? '',
    };
  });
}

function toRules(op: ParsedOperation): IServiceCallRule[] {
  return Object.entries(op.responses)
    .filter(([code]) => {
      const n = parseInt(code, 10);
      return n >= 400 && n < 600;
    })
    .map(([code, desc]) => ({
      expression: b64('(req, dbo) => false'),
      path: '',
      error: desc || `Error ${code}`,
      code: parseInt(code, 10),
    }));
}

function operationToCall(op: ParsedOperation): IServiceCall {
  const nonBodyParams = op.parameters.filter((p) => p.target !== 'body');
  const callParams = toCallParameters(nonBodyParams);
  const bodyParams = bodySchemaToParameters(
    op.requestBodySchema,
    callParams.length,
  );

  return {
    path: toExpressPath(op.path),
    verb: (SUPPORTED_VERBS.has(op.method) ? op.method : 'GET') as HttpVerb,
    description: op.summary || op.description,
    response: stubResponse(op),
    file: '',
    respType: toRespType(op.responseContentType),
    rules: toRules(op),
    body: '',
    parameters: [...callParams, ...bodyParams],
    headers: {},
    cookies: {},
  };
}

export interface OpenApiToServiceOptions {
  /** Path globale del service (slugificato dal title se omesso). */
  path?: string;
  /** Nome del service (title del documento se omesso). */
  name?: string;
}

/**
 * Converte un `ParsedImport` in un singolo `IService`.
 *
 * Le operazioni di tutti i gruppi vengono appiattite in `service.calls`,
 * filtrate ai soli verb supportati (GET/POST/PUT/PATCH/DELETE) e dedupate
 * per `(verb, path)` mantenendo la prima occorrenza.
 */
export function openApiToService(
  parsed: ParsedImport,
  options: OpenApiToServiceOptions = {},
): IService {
  const seen = new Set<string>();
  const calls: IServiceCall[] = [];
  for (const group of parsed.groups) {
    for (const op of group.operations) {
      if (!SUPPORTED_VERBS.has(op.method)) continue;
      const key = `${op.method}|${op.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      calls.push(operationToCall(op));
    }
  }

  const now = Date.now();
  const fallbackPath = slugify(parsed.title) || `import-${now}`;

  return {
    owner: '',
    starred: false,
    lastChange: now,
    creationDate: now,
    name: (options.name ?? parsed.title).trim(),
    description: parsed.description,
    active: false,
    dbo: '',
    path: (options.path ?? fallbackPath).trim(),
    calls,
    schedulerFn: '',
    interval: 0,
  };
}
