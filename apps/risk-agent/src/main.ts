import { CaslForbiddenErrorFilter } from '@app/common/exception-filters/casl-forbidden-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { KafkaOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { RiskAgentModule } from './risk-agent.module';

async function bootstrap() {
  const app = await NestFactory.create(RiskAgentModule);
  app.setGlobalPrefix('risk-agent');

  app.use(helmet());
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new CaslForbiddenErrorFilter());
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [configService.getOrThrow<string>('FRONTEND_DOMAIN')],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, Accept',
    maxAge: 7200,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Risk Agent')
    .setDescription(
      'Risk Agent — LLM judgment layer over risk-operation. Production LLM Agent per agents/domain/risk-agent/AGENT.md.',
    )
    .setVersion('1.0')
    .addTag('risk-agent')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'id-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('risk-agent/api', app, document);

  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
      },
      consumer: {
        groupId: 'risk-agent',
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
