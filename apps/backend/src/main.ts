import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from './defaults';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // cookie-parser: popola req.cookies usato nello scope delle espressioni mock
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS permissivo: gli endpoint /api/service/* devono essere raggiungibili
  // da qualsiasi dominio esterno (mock service pubblici)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: false,
  });

  // Inizializza NestJS e registra tutte le rotte API prima di aggiungere
  // il serving statico, così il fallback SPA non interferisce con /api/*
  await app.init();

  // Serving del frontend Angular (solo in produzione, quando il build esiste)
  // dist/apps/backend -> ../../frontend/browser = dist/frontend/browser
  const frontendPath = join(__dirname, '..', '..', 'frontend', 'browser');
  if (existsSync(frontendPath)) {
    // Serve i file statici compilati (JS, CSS, assets, ecc.)
    app.useStaticAssets(frontendPath);

    // SPA fallback: qualsiasi rotta non gestita da NestJS restituisce index.html
    // (necessario per il client-side routing di Angular)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.getHttpAdapter().getInstance().get('*', (_req: any, res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      res.sendFile(join(frontendPath, 'index.html'));
    });
  }

  const port = process.env['PORT'] ?? DEFAULT_PORT;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}/api`);
}

bootstrap();
