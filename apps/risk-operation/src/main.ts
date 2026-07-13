import { CaslForbiddenErrorFilter } from '@app/common/exception-filters/casl-forbidden-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { GrpcOptions, KafkaOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as path from 'path';
import { RiskOperationModule } from './risk-operation.module';

async function bootstrap() {
  const app = await NestFactory.create(RiskOperationModule);
  app.setGlobalPrefix('risk-operation');

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
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Risk Operation')
    .setDescription('Risk Operation microservice')
    .setVersion('1.0')
    .addTag('risk-operation')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'id-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('risk-operation/api', app, document);
  app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5000',
      package: 'risk_operation',
      protoPath: path.resolve(
        configService.getOrThrow('ROOT_DIR'),
        './apps/risk-operation/proto/main.proto',
      ),
      loader: {
        arrays: true,
        enums: String,
        includeDirs: [
          path.resolve(configService.getOrThrow('ROOT_DIR'), './apps'),
        ],
      },
    },
  });
  app.connectMicroservice<KafkaOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
      },
      consumer: {
        groupId: 'risk-operation',
      },
    },
  });
  await app.startAllMicroservices();
  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
