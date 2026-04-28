import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { MAX_ACTIVE_KEYS_PER_USER } from '../../api-keys/api-keys.service';
import { AuthenticatedUser } from '../../auth/interfaces/request-with-user.interface';
import { mcpResult } from './_helpers';
import { ToolDeps } from './_tool-deps';
import { ConfigService } from '@nestjs/config';

const DEFAULT_EXPRESSION_SIZE_LIMIT = 64 * 1024;
const DEFAULT_DB_SIZE_LIMIT = 1024 * 1024;
const DEFAULT_OPENAPI_SIZE_LIMIT = 5_000_000;
const DEFAULT_MCP_THROTTLE_PER_MIN = 200;

function readNumber(config: ConfigService, key: string, fallback: number): number {
  const raw = config.get<string>(key);
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Tool MCP `get_workspace_info` — bootstrap di sessione.
 *
 * Restituisce in un colpo solo lo stato del workspace dell'utente autenticato
 * + i vincoli operativi del backend + l'elenco delle MCP resources che
 * l'agente può caricare on-demand. Pensato come prima chiamata della sessione.
 */
export function registerGetWorkspaceInfo(
  server: McpServer,
  user: AuthenticatedUser,
  deps: ToolDeps,
): void {
  server.registerTool(
    'get_workspace_info',
    {
      title: 'Get workspace info',
      description:
        "Returns the authenticated user's workspace summary (id/email/role, services count, API keys count), backend operational limits (expression size, dbo size, openapi size, max API keys, MCP throttle per minute), server version, and the list of available MCP reference resources. Call this once at the start of an authoring session.",
    },
    async () => {
      const services = await deps.servicesService.findAll(user.userId);
      const activeServicesCount = services.filter((s) => s.active).length;
      const apiKeys = await deps.apiKeysService.listForUser(user.userId);
      const activeApiKeysCount = apiKeys.filter((k) => !k.revokedAt).length;

      return mcpResult({
        user: {
          id: user.userId,
          email: user.email,
          isAdmin: user.role === 'admin',
        },
        stats: {
          servicesCount: services.length,
          activeServicesCount,
          apiKeysCount: activeApiKeysCount,
        },
        limits: {
          expressionSizeBytes: readNumber(
            deps.config,
            'VIRTUALSERVICE_EXPRESSION_SIZE_LIMIT',
            DEFAULT_EXPRESSION_SIZE_LIMIT,
          ),
          dboSizeBytes: readNumber(
            deps.config,
            'VIRTUALSERVICE_DB_SIZE_LIMIT',
            DEFAULT_DB_SIZE_LIMIT,
          ),
          openapiSizeBytes: readNumber(
            deps.config,
            'VIRTUALSERVICE_OPENAPI_SIZE_LIMIT',
            DEFAULT_OPENAPI_SIZE_LIMIT,
          ),
          maxApiKeys: MAX_ACTIVE_KEYS_PER_USER,
          throttleMcpPerMin: readNumber(
            deps.config,
            'VIRTUALSERVICE_MCP_THROTTLE_PER_MIN',
            DEFAULT_MCP_THROTTLE_PER_MIN,
          ),
        },
        server: {
          version: deps.serverVersion,
          mcpProtocolVersion: LATEST_PROTOCOL_VERSION,
        },
        availableResources: deps.resources.list().map((r) => r.uri),
      });
    },
  );
}
