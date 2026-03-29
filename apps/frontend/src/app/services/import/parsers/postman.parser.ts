import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from './file-parser';

// ── Postman Collection v2 / v2.1 types (subset) ────────────────────────────

interface PostmanVariable {
  key: string;
  value?: string;
}

interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value?: string; disabled?: boolean }>;
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanBody {
  mode?: string;
  raw?: string;
}

interface PostmanRequest {
  method?: string;
  header?: PostmanHeader[];
  url?: string | PostmanUrl;
  body?: PostmanBody;
  description?: string;
}

interface PostmanItem {
  name?: string;
  request?: PostmanRequest;
  item?: PostmanItem[];           // folders nest items
  description?: string;
}

interface PostmanCollection {
  info?: {
    name?: string;
    description?: string;
    schema?: string;
    _postman_id?: string;
  };
  item?: PostmanItem[];
  variable?: PostmanVariable[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/** Resolve Postman URL object/string into a path template + query params */
function resolveUrl(url: string | PostmanUrl | undefined): {
  path: string;
  queryParams: ParsedParameter[];
} {
  if (!url) return { path: '/', queryParams: [] };

  if (typeof url === 'string') {
    try {
      const u = new URL(url);
      const queryParams: ParsedParameter[] = [];
      u.searchParams.forEach((value, name) => {
        queryParams.push({ name, target: 'query', required: false, example: value });
      });
      return { path: u.pathname || '/', queryParams };
    } catch {
      return { path: url, queryParams: [] };
    }
  }

  // PostmanUrl object
  const pathSegments = url.path ?? [];
  let path = '/' + pathSegments
    .map((seg) => seg.startsWith(':') ? seg : seg)
    .join('/');
  // Normalise double slashes
  path = path.replace(/\/+/g, '/') || '/';

  const queryParams: ParsedParameter[] = (url.query ?? [])
    .filter((q) => !q.disabled)
    .map((q) => ({
      name: q.key,
      target: 'query' as const,
      required: false,
      example: q.value ?? '',
    }));

  return { path, queryParams };
}

/** Extract path parameters from Postman-style `:param` segments */
function extractPathParams(path: string): ParsedParameter[] {
  const matches = path.match(/:(\w+)/g);
  if (!matches) return [];
  return matches.map((m) => ({
    name: m.substring(1),
    target: 'path' as const,
    required: true,
  }));
}

// ── Recursive item walker ───────────────────────────────────────────────────

interface FlatItem {
  folderName: string;
  name: string;
  request: PostmanRequest;
}

function flattenItems(items: PostmanItem[], folder: string): FlatItem[] {
  const result: FlatItem[] = [];
  for (const item of items) {
    if (item.item && item.item.length > 0) {
      // Folder
      const sub = flattenItems(item.item, item.name ?? folder);
      result.push(...sub);
    } else if (item.request) {
      result.push({
        folderName: folder,
        name: item.name ?? '',
        request: item.request,
      });
    }
  }
  return result;
}

// ── Item → ParsedOperation ──────────────────────────────────────────────────

function itemToOperation(flat: FlatItem): ParsedOperation {
  const req = flat.request;
  const method = str(req.method, 'GET').toUpperCase();
  const { path, queryParams } = resolveUrl(req.url);
  const pathParams = extractPathParams(path);

  // Headers (skip transport-level)
  const skipHeaders = new Set([
    'content-type', 'accept', 'user-agent', 'authorization', 'cookie', 'host',
  ]);
  const headerParams: ParsedParameter[] = (req.header ?? [])
    .filter((h) => !h.disabled && !skipHeaders.has(h.key.toLowerCase()))
    .map((h) => ({
      name: h.key,
      target: 'header' as const,
      required: false,
      example: h.value,
    }));

  // Body → schema
  let requestBodySchema: Record<string, unknown> | undefined;
  if (req.body?.mode === 'raw' && req.body.raw) {
    try {
      const parsed = JSON.parse(req.body.raw);
      if (isObject(parsed)) {
        const properties: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(parsed)) {
          properties[key] = { type: typeof val, example: val };
        }
        requestBodySchema = { type: 'object', properties };
      }
    } catch {
      // Not JSON
    }
  }

  return {
    method,
    path,
    summary: flat.name,
    description: str(req.description),
    parameters: [...pathParams, ...queryParams, ...headerParams],
    requestBodySchema,
    responses: { '200': 'OK' },
    responseContentType: 'application/json',
    tags: [flat.folderName],
  };
}

// ── FileParser implementation ───────────────────────────────────────────────

export class PostmanParser implements FileParser {
  readonly id = 'postman';
  readonly label = 'Postman Collection';

  canParse(content: string, _filename: string): boolean {
    try {
      const doc = JSON.parse(content);
      if (!isObject(doc)) return false;
      const info = doc['info'];
      if (!isObject(info)) return false;
      // v2 / v2.1 schema URL or _postman_id
      const schema = str(info['schema']);
      if (schema.includes('schema.getpostman.com')) return true;
      if (info['_postman_id']) return true;
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
      throw new Error('The file is not valid JSON.');
    }

    if (!isObject(doc)) {
      throw new Error('The file does not contain a valid JSON object.');
    }

    const collection = doc as unknown as PostmanCollection;
    const info = collection.info ?? {};
    const items = collection.item ?? [];

    if (items.length === 0) {
      throw new Error('The Postman collection contains no requests.');
    }

    const title = str(info.name, 'Postman Collection');
    const flat = flattenItems(items, title);
    const operations = flat.map(itemToOperation);

    if (operations.length === 0) {
      throw new Error('No valid requests found in the Postman collection.');
    }

    // Group by folder
    const groupMap = new Map<string, ParsedOperation[]>();
    for (const op of operations) {
      const tag = op.tags[0] ?? title;
      if (!groupMap.has(tag)) groupMap.set(tag, []);
      groupMap.get(tag)!.push(op);
    }

    const groups: ParsedServiceGroup[] = Array.from(groupMap.entries()).map(
      ([name, ops]) => ({ name, description: '', operations: ops }),
    );

    return {
      formatLabel: 'Postman Collection v2',
      title,
      description: str(info.description),
      version: '',
      groups,
    };
  }
}
