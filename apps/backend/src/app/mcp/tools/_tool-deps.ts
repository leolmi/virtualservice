import { ConfigService } from '@nestjs/config';
import { ServicesService } from '../../services/services.service';
import { LogService } from '../../services/log.service';
import { TemplatesService } from '../../templates/templates.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { McpResourcesService } from '../resources/mcp-resources.service';
import { SystemTemplatesRegistry } from '../resources/system-templates.registry';
import { SnapshotService } from '../snapshot.service';
import { AuditService } from '../audit.service';

/**
 * Pacchetto di servizi iniettato a tutte le tool callbacks dal `McpServerFactory`.
 *
 * Ogni tool consuma il sottoinsieme che gli serve. Aggiungere campi qui mano
 * a mano che le slice successive introdurranno tool che hanno bisogno di
 * altre dipendenze.
 */
export interface ToolDeps {
  servicesService: ServicesService;
  logService: LogService;
  templatesService: TemplatesService;
  apiKeysService: ApiKeysService;
  snapshotService: SnapshotService;
  auditService: AuditService;
  resources: McpResourcesService;
  systemTemplates: SystemTemplatesRegistry;
  config: ConfigService;
  serverVersion: string;
  /** ID dell'API key con cui l'utente è autenticato (per l'audit log). */
  apiKeyId: string;
}
