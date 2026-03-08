import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ServiceCacheService } from './service-cache.service';

/**
 * Modulo condiviso che gestisce la cache in-memoria dei servizi mock.
 * Esportato e riutilizzato sia da MockServerModule che da ServicesModule
 * (per il restart del servizio), evitando dipendenze circolari.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Service.name, schema: ServiceSchema }]),
  ],
  providers: [ServiceCacheService],
  exports: [MongooseModule, ServiceCacheService],
})
export class CacheModule {}
