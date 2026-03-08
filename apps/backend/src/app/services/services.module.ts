import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from './schemas/log.schema';
import { LogService } from './log.service';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { CacheModule } from '../mock-server/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    CacheModule, // ServiceCacheService + MongooseModule(Service)
  ],
  providers: [LogService, ServicesService],
  controllers: [ServicesController],
  exports: [LogService],
})
export class ServicesModule {}
