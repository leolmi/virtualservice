import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';
import { McpResourcesService } from './resources/mcp-resources.service';
import { SystemTemplatesRegistry } from './resources/system-templates.registry';
import { SnapshotService } from './snapshot.service';
import { AuditService } from './audit.service';
import {
  ServiceSnapshot,
  ServiceSnapshotSchema,
} from './schemas/service-snapshot.schema';
import { McpAudit, McpAuditSchema } from './schemas/mcp-audit.schema';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ServicesModule } from '../services/services.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceSnapshot.name, schema: ServiceSnapshotSchema },
      { name: McpAudit.name, schema: McpAuditSchema },
    ]),
    ApiKeysModule, // espone ApiKeysService + ApiKeyGuard
    ServicesModule, // espone ServicesService + LogService
    TemplatesModule, // espone TemplatesService
  ],
  providers: [
    McpServerFactory,
    McpResourcesService,
    SystemTemplatesRegistry,
    SnapshotService,
    AuditService,
  ],
  controllers: [McpController],
  exports: [
    McpResourcesService,
    SystemTemplatesRegistry,
    SnapshotService,
    AuditService,
  ],
})
export class McpModule {}
