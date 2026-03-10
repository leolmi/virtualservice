import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './app/users/users.module';
import { AuthModule } from './app/auth/auth.module';
import { MailModule } from './app/mail/mail.module';
import { ServicesModule } from './app/services/services.module';
import { MockServerModule } from './app/mock-server/mock-server.module';
import { DEFAULT_MONGO_URI } from './defaults';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGO_URI', DEFAULT_MONGO_URI),
      }),
      inject: [ConfigService],
    }),
    MailModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    MockServerModule,
  ],
})
export class AppModule {}
