import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { PayloadTooLargeFilter } from './app/common/payload-too-large.filter';
import {
  DEFAULT_API_BODY_SIZE_LIMIT,
  DEFAULT_BODY_SIZE_LIMIT,
  DEFAULT_PORT,
} from './defaults';
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
  const parseLimit = (raw: string | undefined, fallback: number): number => {
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  const mockBodyLimit = parseLimit(
    config.get<string>('VIRTUALSERVICE_BODY_SIZE_LIMIT'),
    DEFAULT_BODY_SIZE_LIMIT,
  );
  const apiBodyLimit = parseLimit(
    config.get<string>('VIRTUALSERVICE_API_BODY_SIZE_LIMIT'),
    DEFAULT_API_BODY_SIZE_LIMIT,
  );
  // Body parser per-rotta:
  //   /service/* (mock pubblico, accessibile da chiunque) → limite stretto
  //   tutte le altre rotte (autenticazione/autorizzazione applicata dai guard
  //   a valle) → limite generoso, così gli admin possono salvare service grandi.
  // Nota: i parser registrati prima vincono sul match path; il parser globale
  // gira dopo solo se /service non ha già popolato req.body.
  app.use('/service', bodyParser.json({ limit: mockBodyLimit }));
  app.use('/service', bodyParser.urlencoded({ limit: mockBodyLimit, extended: true }));
  app.use(bodyParser.json({ limit: apiBodyLimit }));
  app.use(bodyParser.urlencoded({ limit: apiBodyLimit, extended: true }));
  Logger.log(
    `Body size limits — mock /service/*: ${mockBodyLimit}B, api: ${apiBodyLimit}B`,
    'Bootstrap',
  );

  // cookie-parser: popola req.cookies usato nello scope delle espressioni mock
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filter globale: arricchisce gli errori 413 (PayloadTooLarge) con la
  // dimensione del payload ricevuto e il limite consentito.
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PayloadTooLargeFilter(httpAdapter));

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
