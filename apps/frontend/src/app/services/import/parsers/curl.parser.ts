import {
  FileParser,
  ParsedImport,
  ParsedOperation,
  ParsedParameter,
  ParsedServiceGroup,
} from '@virtualservice/shared/utils';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Split a curl command string respecting quotes and backslash-newline
 * continuations (common in copy-pasted curl commands).
 */
function tokenize(raw: string): string[] {
  // Collapse backslash-newline continuations
  const collapsed = raw.replace(/\\\s*\n/g, ' ');
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (const ch of collapsed) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (/\s/.test(ch) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += ch;
  }
  if (current.length > 0) tokens.push(current);
  return tokens;
}

/** Extract host from a URL for grouping */
function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}

/** Decompose a URL into path template + query parameters */
function decomposeUrl(url: string): { path: string; queryParams: ParsedParameter[] } {
  try {
    const u = new URL(url);
    const queryParams: ParsedParameter[] = [];
    u.searchParams.forEach((value, name) => {
      queryParams.push({
        name,
        target: 'query',
        required: false,
        example: value,
      });
    });
    return { path: u.pathname, queryParams };
  } catch {
    // Not a valid URL — treat the whole thing as a path
    return { path: url, queryParams: [] };
  }
}

// ── Single curl command parser ──────────────────────────────────────────────

interface CurlCommand {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
}

function parseSingleCurl(line: string): CurlCommand | null {
  const tokens = tokenize(line);
  if (tokens.length === 0) return null;

  // Find 'curl' token
  const curlIdx = tokens.findIndex((t) => t === 'curl');
  if (curlIdx === -1) return null;
  const args = tokens.slice(curlIdx + 1);

  let url = '';
  let method = '';
  const headers: Record<string, string> = {};
  let data: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((arg === '-X' || arg === '--request') && i + 1 < args.length) {
      method = args[++i].toUpperCase();
    } else if ((arg === '-H' || arg === '--header') && i + 1 < args.length) {
      const hdr = args[++i];
      const colonIdx = hdr.indexOf(':');
      if (colonIdx > 0) {
        const name = hdr.substring(0, colonIdx).trim();
        const value = hdr.substring(colonIdx + 1).trim();
        headers[name] = value;
      }
    } else if (
      (arg === '-d' || arg === '--data' || arg === '--data-raw' || arg === '--data-binary') &&
      i + 1 < args.length
    ) {
      data = args[++i];
    } else if (arg === '--compressed' || arg === '--insecure' || arg === '-k' ||
               arg === '-s' || arg === '--silent' || arg === '-S' || arg === '-L' ||
               arg === '--location' || arg === '-v' || arg === '--verbose') {
      // skip flag-only options
    } else if ((arg === '-o' || arg === '--output' || arg === '-u' || arg === '--user' ||
                arg === '--connect-timeout' || arg === '-m' || arg === '--max-time') &&
               i + 1 < args.length) {
      // skip options with a value
      i++;
    } else if (!arg.startsWith('-')) {
      // Positional argument → URL
      if (!url) url = arg;
    }
  }

  if (!url) return null;
  if (!method) method = data ? 'POST' : 'GET';

  return { url, method, headers, data };
}

// ── curl → ParsedOperation ──────────────────────────────────────────────────

function curlToOperation(cmd: CurlCommand): ParsedOperation {
  const { path, queryParams } = decomposeUrl(cmd.url);

  const headerParams: ParsedParameter[] = Object.entries(cmd.headers)
    .filter(([name]) => {
      const lower = name.toLowerCase();
      // Skip pseudo-transport headers
      return lower !== 'content-type' && lower !== 'accept' && lower !== 'user-agent'
        && lower !== 'authorization' && lower !== 'cookie';
    })
    .map(([name, value]) => ({
      name,
      target: 'header' as const,
      required: false,
      example: value,
    }));

  // Body schema from --data
  let requestBodySchema: Record<string, unknown> | undefined;
  if (cmd.data) {
    try {
      const parsed = JSON.parse(cmd.data);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        const properties: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(parsed)) {
          properties[key] = { type: typeof val, example: val };
        }
        requestBodySchema = { type: 'object', properties };
      }
    } catch {
      // Not JSON — leave as-is
    }
  }

  const contentType = cmd.headers['Content-Type'] ?? cmd.headers['content-type'] ?? '';
  const responseContentType = contentType.includes('json')
    ? 'application/json'
    : contentType || 'application/json';

  return {
    method: cmd.method,
    path,
    summary: `${cmd.method} ${path}`,
    description: '',
    parameters: [...queryParams, ...headerParams],
    requestBodySchema,
    responses: { '200': 'OK' },
    responseContentType,
    tags: [hostFromUrl(cmd.url)],
  };
}

// ── FileParser implementation ───────────────────────────────────────────────

export class CurlParser implements FileParser {
  readonly id = 'curl';
  readonly label = 'cURL';

  canParse(content: string, filename: string): boolean {
    // File containing at least one 'curl ' command
    const lower = filename.toLowerCase();
    if (lower.endsWith('.curl') || lower.endsWith('.sh') || lower.endsWith('.bash')) return true;
    // Also detect by content: at least one line starting with 'curl '
    return /^\s*curl\s/m.test(content);
  }

  parse(content: string): ParsedImport {
    // Split on lines that start a new curl command.
    // A curl command may span multiple lines via backslash continuation.
    // Strategy: rejoin backslash-continuations first, then split by 'curl '.
    const collapsed = content.replace(/\\\s*\n/g, ' ');
    const lines = collapsed.split('\n').map((l) => l.trim()).filter(Boolean);

    const operations: ParsedOperation[] = [];

    for (const line of lines) {
      // Skip comments and empty
      if (line.startsWith('#') || line.startsWith('//')) continue;
      const cmd = parseSingleCurl(line);
      if (cmd) operations.push(curlToOperation(cmd));
    }

    if (operations.length === 0) {
      throw new Error('No valid curl commands found in the file.');
    }

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
      formatLabel: 'cURL',
      title: 'cURL Import',
      description: `${operations.length} request${operations.length > 1 ? 's' : ''} from curl commands`,
      version: '',
      groups,
    };
  }
}
