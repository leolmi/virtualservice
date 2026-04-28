import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApiKey, ApiKeySchema } from './schemas/api-key.schema';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApiKey.name, schema: ApiKeySchema },
    ]),
    UsersModule, // espone UsersService per il guard
  ],
  providers: [ApiKeysService, ApiKeyGuard],
  controllers: [ApiKeysController],
  exports: [ApiKeysService, ApiKeyGuard],
})
export class ApiKeysModule {}
