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
import { ApiKeysModule } from './app/api-keys/api-keys.module';
import { McpModule } from './app/mcp/mcp.module';
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
        const mcpLimit = parseInt(
          config.get<string>('VIRTUALSERVICE_MCP_THROTTLE_PER_MIN') ?? '200',
          10,
        );
        return [
          { name: 'default', ttl: 60_000, limit: 60 },
          { name: 'strict',  ttl: 60_000, limit: 5  },
          {
            name: 'service',
            ttl: 60_000,
            limit: serviceLimit,
            // 'service' è limitato solo alle rotte mock pubbliche `/service/*`.
            // Inoltre lo bypassiamo per le request loopback marcate con
            // `X-Vs-Mcp: 1` (il throttle `'mcp'` lato MCP fa già da guardrail).
            skipIf: (ctx) => {
              const req = ctx.switchToHttp().getRequest();
              if (req?.headers?.['x-vs-mcp'] === '1') return true;
              const url: string = req?.originalUrl ?? req?.url ?? '';
              return !url.startsWith('/service/');
            },
          },
          {
            name: 'mcp',
            ttl: 60_000,
            limit: mcpLimit,
            // 'mcp' è limitato solo all'endpoint `/mcp`.
            skipIf: (ctx) => {
              const req = ctx.switchToHttp().getRequest();
              const url: string = req?.originalUrl ?? req?.url ?? '';
              return !url.startsWith('/mcp');
            },
          },
        ];
      },
    }),
    ServeStaticModule.forRoot({ rootPath: join(__dirname, 'public/browser') }),
    MailModule,
    UsersModule,
    AuthModule,
    ServicesModule,
    TemplatesModule,
    ApiKeysModule,
    McpModule,
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
