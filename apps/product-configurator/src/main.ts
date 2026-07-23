import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ProductConfiguratorModule } from './product-configurator.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductConfiguratorModule);
  app.setGlobalPrefix('product-configurator');

  app.use(helmet());
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  app.enableCors({
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
    .setTitle('Product Configurator')
    .setDescription(
      'Product registry, master rate cards, legal template bindings and snapshotted client assignments',
    )
    .setVersion('1.0')
    .addTag('product-configurator')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'id-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('product-configurator/api-docs', app, document);

  await app.listen(configService.getOrThrow('PORT'));
  process.on('SIGTERM', async () => await app.close());
  process.on('SIGINT', async () => await app.close());
}
bootstrap();
