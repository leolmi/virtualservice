import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ServicesService } from '../services/services.service';
import { LogService } from '../services/log.service';
import { TemplatesService } from '../templates/templates.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { McpResourcesService } from './resources/mcp-resources.service';
import { SystemTemplatesRegistry } from './resources/system-templates.registry';
import { SnapshotService } from './snapshot.service';
import { AuditService } from './audit.service';
import { VS_INSTRUCTIONS } from './instructions';
import { ToolDeps } from './tools/_tool-deps';
import { registerGetWorkspaceInfo } from './tools/get-workspace-info.tool';
import { registerListServices } from './tools/list-services.tool';
import { registerGetService } from './tools/get-service.tool';
import { registerGetCall } from './tools/get-call.tool';
import { registerGetLogs } from './tools/get-logs.tool';
import { registerSearchTemplates } from './tools/search-templates.tool';
import { registerGetTemplate } from './tools/get-template.tool';
import { registerListHistory } from './tools/list-history.tool';
import { registerRestoreSnapshot } from './tools/restore-snapshot.tool';
import { AuthenticatedUser } from '../auth/interfaces/request-with-user.interface';

const SERVER_NAME = 'virtualservice-mcp';
const SERVER_VERSION = '1.0.0';

/**
 * Factory che produce un'istanza di `McpServer` configurata per l'utente
 * autenticato corrente.
 *
 * Operiamo in **modalità stateless**: una nuova istanza di `McpServer` per
 * ogni richiesta HTTP. Le tool callbacks chiudono sull'utente e su `apiKeyId`,
 * così possono usare `userId`/`keyId` (per l'audit) senza propagarli come
 * context request-scoped del SDK.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly logService: LogService,
    private readonly templatesService: TemplatesService,
    private readonly apiKeysService: ApiKeysService,
    private readonly snapshotService: SnapshotService,
    private readonly auditService: AuditService,
    private readonly resources: McpResourcesService,
    private readonly systemTemplates: SystemTemplatesRegistry,
    private readonly config: ConfigService,
  ) {}

  create(user: AuthenticatedUser, apiKeyId: string): McpServer {
    const server = new McpServer(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        instructions: VS_INSTRUCTIONS,
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.registerResources(server);
    this.registerTools(server, user, apiKeyId);

    return server;
  }

  // ── Resources ────────────────────────────────────────────────────────────

  private registerResources(server: McpServer): void {
    for (const entry of this.resources.list()) {
      server.registerResource(
        entry.uri,
        entry.uri,
        {
          title: entry.title,
          description: entry.description,
          mimeType: entry.mimeType,
        },
        async (uri) => {
          const found = this.resources.read(uri.href);
          if (!found) {
            throw new Error(`Resource not found: ${uri.href}`);
          }
          return {
            contents: [
              {
                uri: uri.href,
                mimeType: found.entry.mimeType,
                text: found.text,
              },
            ],
          };
        },
      );
    }
  }

  // ── Tools ────────────────────────────────────────────────────────────────

  private registerTools(
    server: McpServer,
    user: AuthenticatedUser,
    apiKeyId: string,
  ): void {
    const deps: ToolDeps = {
      servicesService: this.servicesService,
      logService: this.logService,
      templatesService: this.templatesService,
      apiKeysService: this.apiKeysService,
      snapshotService: this.snapshotService,
      auditService: this.auditService,
      resources: this.resources,
      systemTemplates: this.systemTemplates,
      config: this.config,
      serverVersion: SERVER_VERSION,
      apiKeyId,
    };

    // Bootstrap
    registerGetWorkspaceInfo(server, user, deps);

    // Read-only services
    registerListServices(server, user, deps);
    registerGetService(server, user, deps);
    registerGetCall(server, user, deps);
    registerGetLogs(server, user, deps);

    // Read-only templates
    registerSearchTemplates(server, user, deps);
    registerGetTemplate(server, user, deps);

    // History (snapshot)
    registerListHistory(server, user, deps);
    registerRestoreSnapshot(server, user, deps);
  }
}
