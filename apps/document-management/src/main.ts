import { CaslForbiddenErrorFilter } from '@app/common/exception-filters/casl-forbidden-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { DocumentManagementModule } from './document-management.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { Response } from 'express';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(DocumentManagementModule);
  app.setGlobalPrefix('document-management');

  app.use(helmet());
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new CaslForbiddenErrorFilter());
  const configService = app.get(ConfigService);
  app.enableCors({
    // Comma-separated so both the legacy apps/web (3001) and the in-progress
    // apps/web-next rebuild (3002) can call the backend during the parallel
    // build — see CLAUDE.md "Planned: Frontend Rebuild". No wildcards.
    origin: configService
      .getOrThrow<string>('FRONTEND_DOMAIN')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    maxAge: 7200,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Document Management')
    .setDescription(
      'Immutable document storage (S3 + SHA-256 integrity hashing), Claude field extraction per document class, cross-validation against the trade directory, the deterministic invoice arithmetic gate, and metadata search. Cross-service data flow is Kafka-only (transactional outbox).',
    )
    .addTag(
      'Documents',
      'Upload onboarding documents and invoices, retrieve metadata and presigned download URLs, review discrepancies and the invoice reconciliation queue.',
    )
    .setVersion('2.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [DocumentsModule],
  });
  SwaggerModule.setup('document-management/api', app, document);
  app.use('/document-management/api-json', (res: Response) => {
    res.json(document);
  });
  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
      },
      consumer: {
        groupId: 'document-management',
      },
    },
  });
  app.use(json({ limit: '100mb' }));

  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
