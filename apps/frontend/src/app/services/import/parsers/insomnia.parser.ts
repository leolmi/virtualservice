import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from './file-parser';

// ── Insomnia v4 export types (subset) ───────────────────────────────────────

interface InsomniaHeader {
  name: string;
  value: string;
  disabled?: boolean;
}

interface InsomniaParameter {
  name: string;
  value: string;
  disabled?: boolean;
}

interface InsomniaBody {
  mimeType?: string;
  text?: string;
}

interface InsomniaResource {
  _id: string;
  _type: string;
  parentId?: string;
  name?: string;
  description?: string;
  method?: string;
  url?: string;
  headers?: InsomniaHeader[];
  parameters?: InsomniaParameter[];
  body?: InsomniaBody;
}

interface InsomniaExport {
  __export_format?: number;
  __export_source?: string;
  resources?: InsomniaResource[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

const SKIP_HEADERS = new Set([
  'content-type', 'accept', 'user-agent', 'authorization', 'cookie', 'host',
]);

function pathFromUrl(url: string): string {
  // Insomnia URLs may contain environment variables like {{ base_url }}/path
  // Strip template variables for path extraction
  const cleaned = url.replace(/\{\{[^}]*}}/g, '');
  try {
    return new URL(cleaned).pathname || '/';
  } catch {
    // If not a valid URL after cleanup, try extracting path after the last //host/
    const match = cleaned.match(/\/[^/].*$/);
    return match ? match[0] : '/';
  }
}

function hostFromUrl(url: string): string {
  const cleaned = url.replace(/\{\{[^}]*}}/g, 'placeholder');
  try {
    return new URL(cleaned).host;
  } catch {
    return 'unknown';
  }
}

// ── Resource → ParsedOperation ──────────────────────────────────────────────

function resourceToOperation(res: InsomniaResource): ParsedOperation {
  const method = str(res.method, 'GET').toUpperCase();
  const url = str(res.url);
  const path = pathFromUrl(url);

  // Query parameters from Insomnia's parameters array
  const queryParams: ParsedParameter[] = (res.parameters ?? [])
    .filter((p) => !p.disabled)
    .map((p) => ({
      name: p.name,
      target: 'query' as const,
      required: false,
      example: p.value,
    }));

  // Extract path parameters (:param style)
  const pathMatches = path.match(/:(\w+)/g);
  const pathParams: ParsedParameter[] = (pathMatches ?? []).map((m) => ({
    name: m.substring(1),
    target: 'path' as const,
    required: true,
  }));

  // Custom headers
  const headerParams: ParsedParameter[] = (res.headers ?? [])
    .filter((h) => !h.disabled && !SKIP_HEADERS.has(h.name.toLowerCase()))
    .map((h) => ({
      name: h.name,
      target: 'header' as const,
      required: false,
      example: h.value,
    }));

  // Body schema
  let requestBodySchema: Record<string, unknown> | undefined;
  if (res.body?.text) {
    try {
      const parsed = JSON.parse(res.body.text);
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
    summary: str(res.name) || `${method} ${path}`,
    description: str(res.description),
    parameters: [...pathParams, ...queryParams, ...headerParams],
    requestBodySchema,
    responses: { '200': 'OK' },
    responseContentType: 'application/json',
    tags: [],   // will be filled by folder grouping
  };
}

// ── FileParser implementation ───────────────────────────────────────────────

export class InsomniaParser implements FileParser {
  readonly id = 'insomnia';
  readonly label = 'Insomnia';

  canParse(content: string, _filename: string): boolean {
    try {
      const doc = JSON.parse(content);
      if (!isObject(doc)) return false;
      // Insomnia v4 export format
      return doc['__export_format'] === 4 && Array.isArray(doc['resources']);
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

    const exp = doc as unknown as InsomniaExport;
    const resources = exp.resources ?? [];

    // Build folder-name lookup (request_group → name)
    const folderNames = new Map<string, string>();
    let workspaceName = 'Insomnia Import';

    for (const res of resources) {
      if (res._type === 'request_group') {
        folderNames.set(res._id, str(res.name, 'Folder'));
      }
      if (res._type === 'workspace') {
        workspaceName = str(res.name, workspaceName);
      }
    }

    // Extract requests and assign folder names
    const requests = resources.filter((r) => r._type === 'request' && r.url);

    if (requests.length === 0) {
      throw new Error('No requests found in the Insomnia export.');
    }

    const operations: ParsedOperation[] = [];
    const opFolders: string[] = [];

    for (const req of requests) {
      const op = resourceToOperation(req);
      const folder = (req.parentId && folderNames.get(req.parentId)) ?? workspaceName;
      op.tags = [folder];
      opFolders.push(folder);
      operations.push(op);
    }

    // Group by folder
    const groupMap = new Map<string, ParsedOperation[]>();
    for (let i = 0; i < operations.length; i++) {
      const tag = opFolders[i];
      if (!groupMap.has(tag)) groupMap.set(tag, []);
      groupMap.get(tag)!.push(operations[i]);
    }

    const groups: ParsedServiceGroup[] = Array.from(groupMap.entries()).map(
      ([name, ops]) => ({ name, description: '', operations: ops }),
    );

    return {
      formatLabel: 'Insomnia v4',
      title: workspaceName,
      description: `${operations.length} request${operations.length > 1 ? 's' : ''} from Insomnia export`,
      version: '',
      groups,
    };
  }
}
