import * as bcrypt from 'bcryptjs';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { Person } from '../models';
import { PersonRepository } from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const personRepository = app.get(PersonRepository);

  logger.log('Seeding SQFSYS system account...');

  const hashedPassword = await bcrypt.hash('Hann@h12', 10);

  const existing = await personRepository.findOne({
    where: { email: 'tony.murphy@synlian.net' },
  });

  if (existing) {
    logger.log('SQFSYS account already exists — skipping.');
    await app.close();
    return;
  }

  const sqfSysUser = new Person({
    email: 'tony.murphy@synlian.net',
    name: 'Tony Murphy',
    password: hashedPassword,
    systemRole: 'SQFSYS',
  });

  await personRepository.save(sqfSysUser);
  logger.log('SQFSYS account created: tony.murphy@synlian.net');

  await app.close();
}

bootstrap();
