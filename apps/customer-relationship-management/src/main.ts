import { CaslForbiddenErrorFilter } from '@app/common/exception-filters/casl-forbidden-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { CustomerRelationshipManagementModule } from './customer-relationship-management.module';

async function bootstrap() {
  const app = await NestFactory.create(CustomerRelationshipManagementModule);
  app.setGlobalPrefix('customer-relationship-management');

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
    .setTitle('Customer Relationship Management')
    .setDescription('Customer Relationship Management microservice')
    .setVersion('1.0')
    .addTag('customer-relationship-management')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'id-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('customer-relationship-management/api', app, document);
  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
      },
      consumer: {
        groupId: 'customer-relationship-management',
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
