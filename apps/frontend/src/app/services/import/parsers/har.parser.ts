import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from '@virtualservice/shared/utils';

// ── HAR types (subset of HTTP Archive 1.2) ──────────────────────────────────

interface HarNameValue {
  name: string;
  value: string;
}

interface HarPostData {
  mimeType?: string;
  text?: string;
  params?: HarNameValue[];
}

interface HarRequest {
  method: string;
  url: string;
  headers: HarNameValue[];
  queryString: HarNameValue[];
  postData?: HarPostData;
}

interface HarResponse {
  status: number;
  statusText: string;
  content?: { mimeType?: string };
}

interface HarEntry {
  request: HarRequest;
  response: HarResponse;
}

interface HarLog {
  version?: string;
  entries: HarEntry[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

const SUPPORTED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

const SKIP_HEADERS = new Set([
  'content-type', 'accept', 'user-agent', 'authorization', 'cookie',
  'host', 'connection', 'accept-encoding', 'accept-language',
  'cache-control', 'pragma', 'referer', 'origin', 'sec-fetch-dest',
  'sec-fetch-mode', 'sec-fetch-site', 'sec-ch-ua', 'sec-ch-ua-mobile',
  'sec-ch-ua-platform', 'upgrade-insecure-requests',
]);

/** Skip static resource requests (images, fonts, css, js, etc.) */
function isStaticResource(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(css|js|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|map)$/.test(pathname);
  } catch {
    return false;
  }
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}

function pathFromUrl(url: string): string {
  try {
    return new URL(url).pathname || '/';
  } catch {
    return url;
  }
}

// ── Entry → ParsedOperation ────────────────────────────────────────────────

function entryToOperation(entry: HarEntry): ParsedOperation {
  const req = entry.request;
  const resp = entry.response;
  const method = req.method.toUpperCase();
  const path = pathFromUrl(req.url);

  // Query parameters
  const queryParams: ParsedParameter[] = (req.queryString ?? []).map((q) => ({
    name: q.name,
    target: 'query' as const,
    required: false,
    example: q.value,
  }));

  // Custom headers
  const headerParams: ParsedParameter[] = (req.headers ?? [])
    .filter((h) => !SKIP_HEADERS.has(h.name.toLowerCase()))
    .map((h) => ({
      name: h.name,
      target: 'header' as const,
      required: false,
      example: h.value,
    }));

  // Body schema
  let requestBodySchema: Record<string, unknown> | undefined;
  if (req.postData?.text) {
    try {
      const parsed = JSON.parse(req.postData.text);
      if (isObject(parsed)) {
        const properties: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(parsed)) {
          properties[key] = { type: typeof val, example: val };
        }
        requestBodySchema = { type: 'object', properties };
      }
    } catch {
      // Not JSON body — ignore
    }
  }

  // Response info
  const responses: Record<string, string> = {};
  responses[String(resp.status)] = resp.statusText || `Status ${resp.status}`;

  const responseContentType = resp.content?.mimeType ?? 'application/json';

  return {
    method,
    path,
    summary: `${method} ${path}`,
    description: '',
    parameters: [...queryParams, ...headerParams],
    requestBodySchema,
    responses,
    responseContentType,
    tags: [hostFromUrl(req.url)],
  };
}

// ── Deduplication ───────────────────────────────────────────────────────────

/**
 * HAR files often contain many duplicate requests (e.g. polling).
 * Keep only unique method+path combinations, preferring the first occurrence.
 */
function deduplicateOps(ops: ParsedOperation[]): ParsedOperation[] {
  const seen = new Set<string>();
  const result: ParsedOperation[] = [];
  for (const op of ops) {
    const key = `${op.method} ${op.path}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(op);
    }
  }
  return result;
}

// ── FileParser implementation ───────────────────────────────────────────────

export class HarParser implements FileParser {
  readonly id = 'har';
  readonly label = 'HAR (HTTP Archive)';

  canParse(content: string, filename: string): boolean {
    if (filename.toLowerCase().endsWith('.har')) return true;
    try {
      const doc = JSON.parse(content);
      if (!isObject(doc)) return false;
      const log = doc['log'];
      return isObject(log) && Array.isArray((log as Record<string, unknown>)['entries']);
    } catch {
      return false;
    }
  }

  parse(content: string): ParsedImport {
    let doc: unknown;
    try {
      doc = JSON.parse(content);
    } catch {
      throw new Error('The HAR file is not valid JSON.');
    }

    if (!isObject(doc) || !isObject((doc as Record<string, unknown>)['log'])) {
      throw new Error('The file is not a valid HAR document (missing "log" object).');
    }

    const log = (doc as Record<string, unknown>)['log'] as unknown as HarLog;
    const entries = log.entries ?? [];

    if (entries.length === 0) {
      throw new Error('The HAR file contains no entries.');
    }

    // Filter: keep only API-like requests (skip static resources, keep supported methods)
    const apiEntries = entries.filter((e) => {
      const method = e.request.method.toUpperCase();
      if (!SUPPORTED_METHODS.has(method)) return false;
      if (isStaticResource(e.request.url)) return false;
      return true;
    });

    if (apiEntries.length === 0) {
      throw new Error('No API requests found in the HAR file (only static resources were detected).');
    }

    const operations = deduplicateOps(apiEntries.map(entryToOperation));

    // Group by host
    const groupMap = new Map<string, ParsedOperation[]>();
    for (const op of operations) {
      const tag = op.tags[0] ?? 'default';
      if (!groupMap.has(tag)) groupMap.set(tag, []);
      groupMap.get(tag)!.push(op);
    }

    const groups: ParsedServiceGroup[] = Array.from(groupMap.entries()).map(
      ([name, ops]) => ({ name, description: '', operations: ops }),
    );

    return {
      formatLabel: `HAR ${str(log.version, '1.2')}`,
      title: 'HAR Import',
      description: `${operations.length} unique API request${operations.length > 1 ? 's' : ''} from ${entries.length} recorded entries`,
      version: str(log.version),
      groups,
    };
  }
}
