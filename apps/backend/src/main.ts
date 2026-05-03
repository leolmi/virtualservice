import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { DEFAULT_BODY_SIZE_LIMIT, DEFAULT_PORT } from './defaults';
import { readFileSync } from 'fs';
import { join } from 'path';
const { version } = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8')) as { version: string };

console.log(`
 _____ _     _           _ _____             _
|  |  |_|___| |_ _ _ ___| |   __|___ ___ _ _|_|___ ___
|  |  | |  _|  _| | | .'| |__   | -_|  _| | | |  _| -_|
 \\___/|_|_| |_| |___|__,|_|_____|___|_|  \\_/|_|___|___|

 v.${version}  by Leo

 `);

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Prefisso globale /api per tutte le rotte applicative.
  // Esclusi (URL contractuali — non si possono spostare senza coordinare modifiche
  // fuori dal codice):
  //   - /service/*               endpoint pubblico dei mock
  //   - /mcp[/...]               endpoint MCP integration (AI clients)
  //   - /auth/google             redirect-to-Google (registrato sul Google Cloud Console)
  //   - /auth/google/callback    callback OAuth registrato sul Google Cloud Console
  //   - /auth/verify-email       URL inclusa nelle email di verifica già inviate
  // Senza prefisso, le rotte come /discover, /services, /templates collidevano
  // con le rotte SPA dello stesso nome quando si navigava direttamente al path.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'service/*path', method: RequestMethod.ALL },
      { path: 'mcp', method: RequestMethod.ALL },
      { path: 'mcp/*path', method: RequestMethod.ALL },
      { path: 'auth/google', method: RequestMethod.GET },
      { path: 'auth/google/callback', method: RequestMethod.GET },
      { path: 'auth/verify-email', method: RequestMethod.GET },
    ],
  });

  const config = app.get(ConfigService);
  const rawBodyLimit = config.get<string>('VIRTUALSERVICE_BODY_SIZE_LIMIT');
  const bodyLimit = rawBodyLimit ? parseInt(rawBodyLimit, 10) : DEFAULT_BODY_SIZE_LIMIT;
  const bodyLimitBytes = Number.isFinite(bodyLimit) && bodyLimit > 0 ? bodyLimit : DEFAULT_BODY_SIZE_LIMIT;
  app.useBodyParser('json', { limit: bodyLimitBytes });
  app.useBodyParser('urlencoded', { limit: bodyLimitBytes, extended: true });
  Logger.log(`Body size limit: ${bodyLimitBytes} bytes`, 'Bootstrap');

  // cookie-parser: popola req.cookies usato nello scope delle espressioni mock
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS permissivo: gli endpoint /service/* devono essere raggiungibili
  // da qualsiasi dominio esterno (mock service pubblici).
  // exposedHeaders: '*' è ammesso dalla spec Fetch perché credentials === false.
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: false,
  });

  const port = process.env['PORT'] ?? DEFAULT_PORT;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}

bootstrap();
