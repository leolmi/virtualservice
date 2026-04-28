import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UsersModule } from './app/users/users.module';
import { AuthModule } from './app/auth/auth.module';
import { MailModule } from './app/mail/mail.module';
import { ServicesModule } from './app/services/services.module';
import { TemplatesModule } from './app/templates/templates.module';
import { MockServerModule } from './app/mock-server/mock-server.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RequestLoggerMiddleware } from './app/common/request-logger.middleware';
import { DEFAULT_MONGO_URI } from './defaults';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>(
          'VIRTUALSERVICE_MONGO_URI',
          DEFAULT_MONGO_URI,
        ),
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const serviceLimit = parseInt(
          config.get<string>('VIRTUALSERVICE_SERVICE_THROTTLE_LIMIT') ?? '300',
          10,
        );
        return [
          { name: 'default', ttl: 60_000, limit: 60 },
          { name: 'strict',  ttl: 60_000, limit: 5  },
          { name: 'service', ttl: 60_000, limit: serviceLimit },
        ];
      },
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, 'public/browser') }),
    MailModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    TemplatesModule,
    MockServerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
