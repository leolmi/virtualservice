import { lookup } from 'dns/promises';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchOpenApiOptions {
  /** Limite massimo in byte del corpo della response. */
  sizeLimitBytes: number;
  /** Se true, applica la SSRF guard (bloccando IP privati/loopback). */
  enforceSsrfGuard: boolean;
  /** Timeout in ms (default 10s). */
  timeoutMs?: number;
}

export type FetchOpenApiError =
  | { kind: 'invalid-url'; message: string }
  | { kind: 'protocol'; message: string }
  | { kind: 'ssrf'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'http'; message: string; status: number }
  | { kind: 'too-large'; message: string; size: number; limit: number };

export type FetchOpenApiResult =
  | { ok: true; content: string; size: number }
  | { ok: false; error: FetchOpenApiError };

/**
 * Riconosce IPv4 / IPv6 privati, loopback e link-local.
 * Conservativo: in dubbio considera privato.
 */
function isPrivateOrLoopback(ip: string): boolean {
  // IPv4
  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip);
  if (ipv4) {
    const a = parseInt(ipv4[1], 10);
    const b = parseInt(ipv4[2], 10);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 0) return true; // "this network"
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    return false;
  }
  // IPv6
  const lower = ip.toLowerCase();
  if (lower === '::1') return true; // loopback
  if (lower.startsWith('fe80:')) return true; // link-local
  if (/^f[cd]/.test(lower)) return true; // unique-local
  if (lower === '::') return true;
  return false;
}

/**
 * SSRF guard: rifiuta protocolli non http/https, hostname testuali tipici di
 * rete interna, e IP privati/loopback/link-local risolti via DNS.
 */
async function assertSafeForFetch(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw { kind: 'invalid-url', message: 'Invalid URL' } as FetchOpenApiError;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw {
      kind: 'protocol',
      message: `Only http(s) URLs are allowed; got "${parsed.protocol}"`,
    } as FetchOpenApiError;
  }

  const host = parsed.hostname.toLowerCase();
  // Hostname testuali da rifiutare a prescindere
  const localHostnames = ['localhost', 'ip6-localhost', 'broadcasthost'];
  if (localHostnames.includes(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw {
      kind: 'ssrf',
      message: `Hostname "${host}" is not allowed (private/local)`,
    } as FetchOpenApiError;
  }

  // Risolve l'IP via DNS e controlla il range
  let address: string;
  try {
    const { address: addr } = await lookup(host, { all: false });
    address = addr;
  } catch (err) {
    throw {
      kind: 'network',
      message: `DNS resolution failed: ${(err as Error).message}`,
    } as FetchOpenApiError;
  }

  if (isPrivateOrLoopback(address)) {
    throw {
      kind: 'ssrf',
      message: `URL "${rawUrl}" resolves to private/loopback address ${address}`,
    } as FetchOpenApiError;
  }

  return parsed;
}

/**
 * Fetch dell'URL con timeout, controllo Content-Length, e SSRF guard
 * opzionale (attivata in produzione). Non genera mai eccezioni — ritorna
 * sempre `{ ok, ... }` con un errore strutturato.
 */
export async function fetchOpenApiUrl(
  rawUrl: string,
  options: FetchOpenApiOptions,
): Promise<FetchOpenApiResult> {
  let url: URL;
  if (options.enforceSsrfGuard) {
    try {
      url = await assertSafeForFetch(rawUrl);
    } catch (err) {
      return { ok: false, error: err as FetchOpenApiError };
    }
  } else {
    try {
      url = new URL(rawUrl);
    } catch {
      return { ok: false, error: { kind: 'invalid-url', message: 'Invalid URL' } };
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        ok: false,
        error: {
          kind: 'protocol',
          message: `Only http(s) URLs are allowed; got "${url.protocol}"`,
        },
      };
    }
  }

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json, application/yaml, text/yaml, */*' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          status: response.status,
          message: `HTTP ${response.status} ${response.statusText}`,
        },
      };
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const len = parseInt(contentLength, 10);
      if (Number.isFinite(len) && len > options.sizeLimitBytes) {
        return {
          ok: false,
          error: {
            kind: 'too-large',
            size: len,
            limit: options.sizeLimitBytes,
            message: `Response Content-Length ${len} exceeds limit ${options.sizeLimitBytes}`,
          },
        };
      }
    }

    const text = await response.text();
    const size = Buffer.byteLength(text, 'utf8');
    if (size > options.sizeLimitBytes) {
      return {
        ok: false,
        error: {
          kind: 'too-large',
          size,
          limit: options.sizeLimitBytes,
          message: `Response body ${size} bytes exceeds limit ${options.sizeLimitBytes}`,
        },
      };
    }

    return { ok: true, content: text, size };
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      return {
        ok: false,
        error: {
          kind: 'timeout',
          message: `Fetch timed out after ${timeoutMs}ms`,
        },
      };
    }
    return {
      ok: false,
      error: {
        kind: 'network',
        message: (err as Error).message ?? 'Network error',
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verifica che un payload (es. ricevuto in `import_from_openapi_content`) non
 * superi il limite di byte. Ritorna il size in byte se ok, altrimenti errore.
 */
export function checkOpenApiContentSize(
  content: string,
  sizeLimitBytes: number,
):
  | { ok: true; size: number }
  | { ok: false; size: number; limit: number; message: string } {
  const size = Buffer.byteLength(content, 'utf8');
  if (size > sizeLimitBytes) {
    return {
      ok: false,
      size,
      limit: sizeLimitBytes,
      message: `Content body ${size} bytes exceeds limit ${sizeLimitBytes}`,
    };
  }
  return { ok: true, size };
}
