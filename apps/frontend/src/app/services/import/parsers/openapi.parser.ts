import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from './file-parser';

// ── Helpers ─────────────────────────────────────────────────────────────────

const VALID_METHODS = new Set([
  'get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace',
]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

/** Resolve a local $ref (#/…) inside the document */
function resolveRef(
  doc: Record<string, unknown>,
  ref: string,
): Record<string, unknown> | undefined {
  if (!ref.startsWith('#/')) return undefined;
  const parts = ref.substring(2).split('/');
  let cur: unknown = doc;
  for (const p of parts) {
    if (!isObject(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return isObject(cur) ? cur : undefined;
}

function resolve(
  doc: Record<string, unknown>,
  obj: unknown,
): Record<string, unknown> | undefined {
  if (!isObject(obj)) return undefined;
  const ref = obj['$ref'];
  if (typeof ref === 'string') return resolveRef(doc, ref);
  return obj as Record<string, unknown>;
}

// ── Swagger 2.0 ─────────────────────────────────────────────────────────────

function parseSwagger2(doc: Record<string, unknown>): ParsedOperation[] {
  const paths = isObject(doc['paths'])
    ? (doc['paths'] as Record<string, unknown>)
    : {};
  const ops: ParsedOperation[] = [];

  for (const [pathTpl, pathItem] of Object.entries(paths)) {
    const resolved = resolve(doc, pathItem);
    if (!resolved) continue;

    const pathParams = arr(resolved['parameters']);

    for (const method of Object.keys(resolved)) {
      if (!VALID_METHODS.has(method)) continue;
      const op = resolve(doc, resolved[method]);
      if (!op) continue;

      const allRaw = [...pathParams, ...arr(op['parameters'])];
      const parameters: ParsedParameter[] = [];
      let requestBodySchema: Record<string, unknown> | undefined;

      for (const raw of allRaw) {
        const p = resolve(doc, raw);
        if (!p) continue;
        const inVal = str(p['in']);

        if (inVal === 'body') {
          const s = resolve(doc, p['schema']);
          if (s) requestBodySchema = s;
          continue;
        }
        if (['path', 'query', 'header'].includes(inVal)) {
          parameters.push({
            name: str(p['name']),
            target: inVal as 'path' | 'query' | 'header',
            required: inVal === 'path' ? true : !!p['required'],
            example: p['example'] ?? p['default'],
          });
        }
      }

      // Responses
      const respRaw = isObject(op['responses'])
        ? (op['responses'] as Record<string, unknown>)
        : {};
      const responses: Record<string, string> = {};
      for (const [code, resp] of Object.entries(respRaw)) {
        const r = resolve(doc, resp);
        responses[code] = str(r?.['description']);
      }

      // Content type
      const produces = arr(op['produces'] ?? doc['produces']);
      const responseContentType =
        produces.length > 0 ? str(produces[0], 'application/json') : 'application/json';

      ops.push({
        method: method.toUpperCase(),
        path: pathTpl,
        summary: str(op['summary']),
        description: str(op['description']),
        parameters,
        requestBodySchema,
        responses,
        responseContentType,
        tags: arr(op['tags']).map((t) => str(t)),
      });
    }
  }
  return ops;
}

// ── OpenAPI 3.x ─────────────────────────────────────────────────────────────

function parseOpenApi3(doc: Record<string, unknown>): ParsedOperation[] {
  const paths = isObject(doc['paths'])
    ? (doc['paths'] as Record<string, unknown>)
    : {};
  const ops: ParsedOperation[] = [];

  for (const [pathTpl, pathItem] of Object.entries(paths)) {
    const resolved = resolve(doc, pathItem);
    if (!resolved) continue;

    const pathParams = arr(resolved['parameters']);

    for (const method of Object.keys(resolved)) {
      if (!VALID_METHODS.has(method)) continue;
      const op = resolve(doc, resolved[method]);
      if (!op) continue;

      const allRaw = [...pathParams, ...arr(op['parameters'])];
      const parameters: ParsedParameter[] = [];

      for (const raw of allRaw) {
        const p = resolve(doc, raw);
        if (!p) continue;
        const inVal = str(p['in']);
        if (['path', 'query', 'header'].includes(inVal)) {
          const schema = resolve(doc, p['schema']);
          parameters.push({
            name: str(p['name']),
            target: inVal as 'path' | 'query' | 'header',
            required: inVal === 'path' ? true : !!p['required'],
            example: p['example'] ?? schema?.['example'] ?? schema?.['default'],
          });
        }
      }

      // Request body
      let requestBodySchema: Record<string, unknown> | undefined;
      const reqBody = resolve(doc, op['requestBody']);
      if (reqBody) {
        const content = isObject(reqBody['content'])
          ? (reqBody['content'] as Record<string, unknown>)
          : {};
        const picked =
          resolve(doc, content['application/json']) ??
          resolve(doc, Object.values(content)[0]);
        if (picked) requestBodySchema = resolve(doc, picked['schema']);
      }

      // Responses
      const respRaw = isObject(op['responses'])
        ? (op['responses'] as Record<string, unknown>)
        : {};
      const responses: Record<string, string> = {};
      let responseContentType = 'application/json';

      for (const [code, resp] of Object.entries(respRaw)) {
        const r = resolve(doc, resp);
        responses[code] = str(r?.['description']);

        if ((code === '200' || code === '201') && r) {
          const respContent = isObject(r['content'])
            ? (r['content'] as Record<string, unknown>)
            : {};
          const firstKey = Object.keys(respContent)[0];
          if (firstKey) responseContentType = firstKey;
        }
      }

      ops.push({
        method: method.toUpperCase(),
        path: pathTpl,
        summary: str(op['summary']),
        description: str(op['description']),
        parameters,
        requestBodySchema,
        responses,
        responseContentType,
        tags: arr(op['tags']).map((t) => str(t)),
      });
    }
  }
  return ops;
}

// ── Grouping ────────────────────────────────────────────────────────────────

/**
 * Groups operations by their first tag. Untagged operations go
 * into a "default" group.
 */
function groupByTag(
  operations: ParsedOperation[],
  fallbackName: string,
): ParsedServiceGroup[] {
  const map = new Map<string, ParsedOperation[]>();

  for (const op of operations) {
    const tag = op.tags.length > 0 ? op.tags[0] : fallbackName;
    if (!map.has(tag)) map.set(tag, []);
    map.get(tag)!.push(op);
  }

  return Array.from(map.entries()).map(([name, ops]) => ({
    name,
    description: '',
    operations: ops,
  }));
}

// ── FileParser implementation ───────────────────────────────────────────────

export class OpenApiParser implements FileParser {
  readonly id = 'openapi';
  readonly label = 'OpenAPI / Swagger';

  canParse(content: string, _filename: string): boolean {
    try {
      const doc = JSON.parse(content);
      if (!isObject(doc)) return false;
      const rec = doc as Record<string, unknown>;
      // Swagger 2.0
      if (typeof rec['swagger'] === 'string' && rec['swagger'].startsWith('2')) return true;
      // OpenAPI 3.x
      if (typeof rec['openapi'] === 'string' && rec['openapi'].startsWith('3')) return true;
      return false;
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedImport {
    let doc: unknown;
    try {
      doc = JSON.parse(content);
    } catch {
      throw new Error(
        'The file is not valid JSON. YAML format is not yet supported — please convert it to JSON first.',
      );
    }

    if (!isObject(doc)) {
      throw new Error('The file does not contain a valid JSON object.');
    }

    const rec = doc as Record<string, unknown>;
    const info = isObject(rec['info'])
      ? (rec['info'] as Record<string, unknown>)
      : {};

    let operations: ParsedOperation[];
    let formatLabel: string;

    if (typeof rec['swagger'] === 'string' && rec['swagger'].startsWith('2')) {
      formatLabel = `Swagger ${str(rec['swagger'])}`;
      operations = parseSwagger2(rec);
    } else if (typeof rec['openapi'] === 'string' && rec['openapi'].startsWith('3')) {
      formatLabel = `OpenAPI ${str(rec['openapi'])}`;
      operations = parseOpenApi3(rec);
    } else {
      throw new Error(
        'Unrecognised OpenAPI format. Expected "swagger": "2.0" or "openapi": "3.x.x".',
      );
    }

    if (operations.length === 0) {
      throw new Error('The document contains no operations (paths are empty).');
    }

    const title = str(info['title'], 'Untitled API');

    return {
      formatLabel,
      title,
      description: str(info['description']),
      version: str(info['version'], '1.0.0'),
      groups: groupByTag(operations, title),
    };
  }
}
