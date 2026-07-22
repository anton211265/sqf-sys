import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { createHash, randomBytes } from 'crypto';
import { PasskeyService } from '../auth/passkey/passkey.service';
import { EnrollmentToken, Person } from '../models';
import { EnrollmentTokenRepository, PersonRepository } from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';

/**
 * Seeds the SQFSYS platform account. Authentication is passkey-only, so
 * instead of a password this prints a one-time enrollment URL — open it in
 * a browser and register a passkey (Touch ID etc.) to gain access.
 * Re-running on an existing account issues a fresh enrollment link (recovery
 * path for a lost device); it never disturbs registered credentials.
 */
async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const personRepository = app.get(PersonRepository);
  const enrollmentTokenRepository = app.get(EnrollmentTokenRepository);
  const passkeyService = app.get(PasskeyService);

  logger.log('Seeding SQFSYS system account...');

  let sqfSysUser = await personRepository.findOne({
    where: { email: 'tony.murphy@synlian.net' },
  });

  if (sqfSysUser) {
    logger.log('SQFSYS account already exists — issuing a fresh enrollment link.');
  } else {
    sqfSysUser = await personRepository.save(
      new Person({
        email: 'tony.murphy@synlian.net',
        name: 'Tony Murphy',
        systemRole: 'SQFSYS',
      }),
    );
    logger.log('SQFSYS account created: tony.murphy@synlian.net');
  }

  const rawToken = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await enrollmentTokenRepository.save(
    new EnrollmentToken({
      person: sqfSysUser,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt,
      usedAt: null,
      createdByPersonId: null,
    }),
  );

  // Plain console output so the URL is copy-pastable from docker exec output
  // eslint-disable-next-line no-console
  console.log('\n=== SQFSYS passkey enrollment (valid 24h, single use) ===');
  // eslint-disable-next-line no-console
  console.log(passkeyService.buildEnrollmentUrl(rawToken));
  // eslint-disable-next-line no-console
  console.log('==========================================================\n');

  await app.close();
}

bootstrap();
