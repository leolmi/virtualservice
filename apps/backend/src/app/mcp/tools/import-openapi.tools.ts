import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  OpenApiParser,
  openApiToService,
  ParsedImport,
} from '@virtualservice/shared/utils';
import { IService } from '@virtualservice/shared/model';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import {
  isMongoDuplicateKey,
  mcpError,
  mcpResult,
  nestErrorToMcp,
  withMutationAudit,
} from './_helpers';
import { ToolDeps } from './_tool-deps';
import {
  checkOpenApiContentSize,
  fetchOpenApiUrl,
} from '../utils/openapi-fetch';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

const DEFAULT_OPENAPI_SIZE_LIMIT = 5_000_000;

function getSizeLimit(deps: ToolDeps): number {
  const raw = deps.config.get<string>('VIRTUALSERVICE_OPENAPI_SIZE_LIMIT');
  if (!raw) return DEFAULT_OPENAPI_SIZE_LIMIT;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : DEFAULT_OPENAPI_SIZE_LIMIT;
}

function isProductionEnv(deps: ToolDeps): boolean {
  return deps.config.get<string>('NODE_ENV') === 'production';
}

interface ParseAndConvertOk {
  ok: true;
  service: IService;
  parsed: ParsedImport;
}
interface ParseAndConvertErr {
  ok: false;
  error: CallToolResult;
}

/** Parsing OpenAPI + conversione in IService, con error mapping MCP. */
function parseAndConvert(
  content: string,
  optsPath: string | undefined,
  optsName: string | undefined,
): ParseAndConvertOk | ParseAndConvertErr {
  const parser = new OpenApiParser();
  let parsed: ParsedImport;
  try {
    parsed = parser.parse(content);
  } catch (err) {
    return {
      ok: false,
      error: mcpError(
        'INVALID_OPENAPI',
        (err as Error).message ?? 'Invalid OpenAPI document',
      ),
    };
  }
  const service = openApiToService(parsed, {
    path: optsPath,
    name: optsName,
  });
  return { ok: true, service, parsed };
}

/**
 * Materializza il flusso comune (parse → convert → dryRun preview o save reale).
 * Riusato sia da `import_from_openapi_url` che da `import_from_openapi_content`.
 */
async function importFromContent(
  content: string,
  user: AuthenticatedUser,
  deps: ToolDeps,
  opts: { path?: string; name?: string; dryRun?: boolean },
): Promise<CallToolResult> {
  const sizeCheck = checkOpenApiContentSize(content, getSizeLimit(deps));
  if (!sizeCheck.ok) {
    return mcpError('OPENAPI_TOO_LARGE', sizeCheck.message, {
      size: sizeCheck.size,
      limit: sizeCheck.limit,
    });
  }

  const result = parseAndConvert(content, opts.path, opts.name);
  if (!result.ok) return result.error;
  const { service, parsed } = result;

  if (opts.dryRun) {
    const suggested = await deps.servicesService.suggestPath(service.path);
    const conflicts =
      suggested === service.path
        ? []
        : [{ type: 'path', path: service.path, suggested }];
    return mcpResult({
      dryRun: true,
      wouldCreateService: {
        name: service.name,
        path: service.path,
        description: service.description,
      },
      formatLabel: parsed.formatLabel,
      title: parsed.title,
      version: parsed.version,
      callsCount: service.calls.length,
      conflicts,
    });
  }

  try {
    const saved = await deps.servicesService.save(
      service as unknown as Record<string, unknown>,
      user.userId,
      user.role,
    );
    return mcpResult({
      id: String(saved._id),
      name: saved.name,
      path: saved.path,
      callsCount: saved.calls?.length ?? 0,
      lastChange: saved.lastChange,
      formatLabel: parsed.formatLabel,
    });
  } catch (err) {
    if (isMongoDuplicateKey(err)) {
      const suggested = await deps.servicesService.suggestPath(service.path);
      return mcpError(
        'PATH_TAKEN',
        `Service path "${service.path}" is already in use`,
        { suggested },
      );
    }
    const mapped = nestErrorToMcp(err);
    if (mapped) return mapped;
    throw err;
  }
}

/**
 * Tool MCP `import_from_openapi_url` — backend fetch dell'URL + import.
 *
 * SSRF guard attiva in **produzione** (`NODE_ENV === 'production'`). In dev
 * permissiva per testing locale (es. `http://localhost:8080`).
 */
export function registerImportFromOpenapiUrl(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'import_from_openapi_url',
    {
      title: 'Import service from OpenAPI URL',
      description:
        "Fetches an OpenAPI 2.x/3.x document (JSON or YAML) from a URL and creates a new service from it. In production, an SSRF guard rejects URLs resolving to private/loopback IPs — if it fails, retry with `import_from_openapi_content` and pass the document body directly. Pass `dryRun: true` to preview the resulting service without writing.",
      inputSchema: {
        url: z.string().url(),
        path: z.string().optional(),
        name: z.string().optional(),
        dryRun: z.boolean().optional(),
      },
    },
    async (input) => {
      const args = input;
      return withMutationAudit(
        {
          tool: 'import_from_openapi_url',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () => {
          const fetched = await fetchOpenApiUrl(input.url, {
            sizeLimitBytes: getSizeLimit(deps),
            enforceSsrfGuard: isProductionEnv(deps),
          });
          if (!fetched.ok) {
            const e = fetched.error;
            switch (e.kind) {
              case 'too-large':
                return mcpError('OPENAPI_TOO_LARGE', e.message, {
                  size: e.size,
                  limit: e.limit,
                });
              case 'invalid-url':
              case 'protocol':
              case 'ssrf':
              case 'timeout':
              case 'network':
              case 'http':
                return mcpError('URL_NOT_REACHABLE', e.message, {
                  hint: 'Try import_from_openapi_content with the document body instead',
                  ...(e.kind === 'http' ? { status: e.status } : {}),
                });
            }
          }
          return importFromContent(fetched.content, user, deps, {
            path: input.path,
            name: input.name,
            dryRun: input.dryRun,
          });
        },
      );
    },
  );
}

/**
 * Tool MCP `import_from_openapi_content` — content diretto (JSON o YAML).
 * Fallback per URL non raggiungibili dal backend (es. dietro VPN / auth).
 */
export function registerImportFromOpenapiContent(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'import_from_openapi_content',
    {
      title: 'Import service from OpenAPI content',
      description:
        "Imports an OpenAPI 2.x/3.x document passed inline as `content` (JSON or YAML). Use this when the document URL is not reachable from the backend (private network, auth-gated, etc.). Pass `dryRun: true` to preview the resulting service without writing.",
      inputSchema: {
        content: z.string().min(1),
        path: z.string().optional(),
        name: z.string().optional(),
        dryRun: z.boolean().optional(),
      },
    },
    async (input) => {
      const args = {
        // Per audit: tronchiamo il content (il _helpers già tronca a 4KB,
        // ma evitiamo di passare 5MB anche solo come oggetto JS in memoria).
        content: `<openapi content, ${input.content.length} chars>`,
        path: input.path,
        name: input.name,
        dryRun: input.dryRun,
      };
      return withMutationAudit(
        {
          tool: 'import_from_openapi_content',
          args,
          user,
          apiKeyId: deps.apiKeyId,
          audit: deps.auditService,
        },
        async () =>
          importFromContent(input.content, user, deps, {
            path: input.path,
            name: input.name,
            dryRun: input.dryRun,
          }),
      );
    },
  );
}
