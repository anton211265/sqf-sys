import { NestFactory } from '@nestjs/core';
import seedMockData from 'apps/trade-directory/test/mock/seed-mock-data';
import { Logger } from 'nestjs-pino';
import { TradeDirectoryModule } from '../trade-directory.module';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  await seedMockData(app);
}
bootstrap();
