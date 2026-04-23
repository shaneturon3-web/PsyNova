import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    const requestId = req.headers['x-request-id'] ?? 'none';
    const authHeader = req.headers.authorization;
    const authHeaderPreview = authHeader ? `${authHeader.slice(0, 24)}...` : 'missing';
    console.log(
      `[ingress] requestId=${requestId} ${req.method} ${req.originalUrl} authHeader=${authHeaderPreview}`,
    );
    res.on('finish', () => {
      console.log(
        `[egress] requestId=${requestId} ${req.method} ${req.originalUrl} status=${res.statusCode} durationMs=${Date.now() - started}`,
      );
    });
    next();
  });
  app.use(json({ limit: '5mb' }));
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
  ];
  const extra = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const originList = [...defaultOrigins, ...extra];
  app.enableCors({
    origin: originList.length ? originList : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  // ASCII-only: non-ASCII or fragile punctuation in response headers can break proxies / 500s.
  const maquetteHeader = 'MOCKUP-PURPOSE-ONLY';
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-PsyNova-Maquette', maquetteHeader);
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PsyNova Backend API')
    .setDescription(
      '**Mockup API — no real clinical services.**\n\n' +
        'MOCKUP-PURPOSE-ONLY (no real services or data).\n\n' +
        'Every response includes header `X-PsyNova-Maquette` with the same canonical notice.',
    )
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
