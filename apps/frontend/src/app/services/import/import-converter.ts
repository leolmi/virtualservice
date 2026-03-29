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
  ParsedServiceGroup,
} from './parsers/file-parser';

// ── Helpers ─────────────────────────────────────────────────────────────────

const SUPPORTED_VERBS = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

/** Convert OpenAPI path template {param} → Express-style :param */
function toExpressPath(path: string): string {
  return path.replace(/\{(\w+)}/g, ':$1');
}

/** Derive a VirtualService ResponseType from a MIME content-type */
function toRespType(contentType: string): ResponseType {
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('html')) return 'html';
  if (contentType.includes('octet-stream') || contentType.includes('pdf')) return 'file';
  return 'text';
}

/** Slugify a string for use as a service path segment */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Generate a minimal stub response expression */
function stubResponse(op: ParsedOperation): string {
  const successCodes = Object.keys(op.responses).filter(
    (c) => c.startsWith('2'),
  );
  const desc =
    successCodes.length > 0
      ? op.responses[successCodes[0]]
      : 'OK';

  if (op.responseContentType.includes('json')) {
    return btoa(`(req, dbo) => ({ message: ${JSON.stringify(desc || 'OK')} })`);
  }
  return btoa(`(req, dbo) => ${JSON.stringify(desc || 'OK')}`);
}

/** Convert parsed parameters into IServiceCallParameter[] */
function toCallParameters(params: ParsedParameter[]): IServiceCallParameter[] {
  return params.map((p, i) => ({
    code: `p${i}`,
    name: p.name,
    target: p.target,
    key: p.target === 'query' ? p.name : undefined,
    value: p.example ?? '',
  }));
}

/** Extract body-field parameters from a JSON-schema (top-level properties only) */
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

/** Build IServiceCallRule[] from error responses */
function toRules(op: ParsedOperation): IServiceCallRule[] {
  return Object.entries(op.responses)
    .filter(([code]) => {
      const n = parseInt(code, 10);
      return n >= 400 && n < 600;
    })
    .map(([code, desc]) => ({
      expression: btoa('(req, dbo) => false'),
      path: '',
      error: desc || `Error ${code}`,
      code: parseInt(code, 10),
    }));
}

// ── Conversion: operation → IServiceCall ────────────────────────────────────

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

// ── Conversion: group → IService ────────────────────────────────────────────

function groupToService(
  group: ParsedServiceGroup,
  selectedOps: Set<ParsedOperation>,
): IService {
  const now = Date.now();
  const calls = group.operations
    .filter((op) => selectedOps.has(op))
    .filter((op) => SUPPORTED_VERBS.has(op.method))
    .map(operationToCall);

  return {
    owner: '',
    starred: false,
    lastChange: now,
    creationDate: now,
    name: group.name,
    description: group.description,
    active: false,
    dbo: '',
    path: slugify(group.name) || `import-${now}`,
    calls,
    schedulerFn: '',
    interval: 0,
  };
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Convert selected operations from a ParsedImport into VirtualService
 * service definitions ready to be saved.
 *
 * @param parsed    The result of a file parser
 * @param selected  Set of operations the user chose to import
 * @returns         Array of IService (one per group that has selected ops)
 */
export function convertToServices(
  parsed: ParsedImport,
  selected: Set<ParsedOperation>,
): IService[] {
  return parsed.groups
    .map((group) => groupToService(group, selected))
    .filter((svc) => svc.calls.length > 0);
}
