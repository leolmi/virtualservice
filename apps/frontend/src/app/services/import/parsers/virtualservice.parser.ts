import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from './file-parser';

// ── Helpers ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

/**
 * Detect whether a JSON object looks like a VirtualService export.
 * Required fields: `name`, `path`, `calls` (array).
 */
function looksLikeVirtualService(doc: Record<string, unknown>): boolean {
  return (
    typeof doc['name'] === 'string' &&
    typeof doc['path'] === 'string' &&
    Array.isArray(doc['calls'])
  );
}

// ── call → ParsedOperation ──────────────────────────────────────────────────

function callToOperation(call: Record<string, unknown>): ParsedOperation {
  const verb = str(call['verb'], 'GET').toUpperCase();
  const path = str(call['path'], '/');
  const description = str(call['description']);

  // Parameters
  const rawParams = Array.isArray(call['parameters']) ? call['parameters'] : [];
  const parameters: ParsedParameter[] = rawParams
    .filter(isObject)
    .map((p: Record<string, unknown>) => ({
      name: str(p['name']),
      target: (str(p['target'], 'query') as 'path' | 'query' | 'header' | 'body'),
      required: p['target'] === 'path',
      example: p['value'],
    }));

  // Response content type hint from respType
  const respType = str(call['respType'], 'json');
  const ctMap: Record<string, string> = {
    json: 'application/json',
    text: 'text/plain',
    html: 'text/html',
    file: 'application/octet-stream',
  };

  // Responses from rules
  const rules = Array.isArray(call['rules']) ? call['rules'] : [];
  const responses: Record<string, string> = { '200': 'OK' };
  for (const rule of rules) {
    if (isObject(rule)) {
      const code = String(rule['code'] ?? 400);
      responses[code] = str(rule['error'], `Error ${code}`);
    }
  }

  return {
    method: verb,
    path,
    summary: description || `${verb} ${path}`,
    description,
    parameters,
    responses,
    responseContentType: ctMap[respType] ?? 'application/json',
    tags: [],
  };
}

// ── Metadata key for the converter ──────────────────────────────────────────

/**
 * The VirtualService parser attaches the original full document as metadata
 * on the ParsedImport so the converter can use the native fields (dbo,
 * schedulerFn, interval, etc.) instead of generating stubs.
 *
 * This key is used as a convention between the parser and the converter.
 */
export const VS_NATIVE_SOURCE_KEY = '__vs_native_source';

// ── FileParser implementation ───────────────────────────────────────────────

export class VirtualServiceParser implements FileParser {
  readonly id = 'virtualservice';
  readonly label = 'VirtualService';

  canParse(content: string, _filename: string): boolean {
    try {
      const doc = JSON.parse(content);
      if (!isObject(doc)) return false;
      return looksLikeVirtualService(doc as Record<string, unknown>);
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

    const rec = doc as Record<string, unknown>;
    if (!looksLikeVirtualService(rec)) {
      throw new Error('The file is not a valid VirtualService export.');
    }

    const name = str(rec['name'], 'Imported Service');
    const description = str(rec['description']);
    const calls = Array.isArray(rec['calls']) ? rec['calls'] : [];

    const operations: ParsedOperation[] = calls
      .filter(isObject)
      .map((c) => callToOperation(c as Record<string, unknown>));

    if (operations.length === 0 && calls.length === 0) {
      // Service with no calls — still valid, import as empty service
    }

    const group: ParsedServiceGroup = {
      name,
      description,
      operations,
    };

    const result: ParsedImport = {
      formatLabel: 'VirtualService',
      title: name,
      description,
      version: '',
      groups: [group],
    };

    // Attach original document for the converter
    (result as unknown as Record<string, unknown>)[VS_NATIVE_SOURCE_KEY] = rec;

    return result;
  }
}
