import { Module } from '@nestjs/common';
import { CacheModule } from './cache.module';
import { ServicesModule } from '../services/services.module';
import { MockServerService } from './mock-server.service';
import { MockServerController } from './mock-server.controller';

@Module({
  imports: [
    CacheModule,     // ServiceCacheService + MongooseModule(Service)
    ServicesModule,  // LogService (esportato)
  ],
  providers: [MockServerService],
  controllers: [MockServerController],
})
export class MockServerModule {}
