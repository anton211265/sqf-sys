import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { KnowledgeGraphModule } from './knowledge-graph.module';

async function bootstrap() {
  const app = await NestFactory.create(KnowledgeGraphModule);
  app.setGlobalPrefix('knowledge-graph');

  app.use(helmet());
  app.useLogger(app.get(Logger));
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
    .setTitle('Knowledge Graph')
    .setDescription(
      'Neo4j projection of the trade directory + GraphRAG opportunity mining',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'id-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('knowledge-graph/api-docs', app, document);

  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
        ssl: configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
      },
      consumer: {
        groupId: 'knowledge-graph',
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
