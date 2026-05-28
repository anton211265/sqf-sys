import { NestFactory } from '@nestjs/core';
import seedMockData from 'apps/risk-operation/test/mock/seed-mock-data';
import { Logger } from 'nestjs-pino';
import { RiskOperationModule } from '../risk-operation.module';

async function bootstrap() {
  const app = await NestFactory.create(RiskOperationModule);
  app.useLogger(app.get(Logger));
  await seedMockData(app);
}
bootstrap();
