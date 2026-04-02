import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from './defaults';
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
  // da qualsiasi dominio esterno (mock service pubblici)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: false,
  });

  const port = process.env['PORT'] ?? DEFAULT_PORT;
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}

bootstrap();
