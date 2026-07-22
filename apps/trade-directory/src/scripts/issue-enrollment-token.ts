import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { createHash, randomBytes } from 'crypto';
import { PasskeyService } from '../auth/passkey/passkey.service';
import { EnrollmentToken } from '../models';
import { EnrollmentTokenRepository, PersonRepository } from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';

/**
 * Ops/recovery script: issues a one-time passkey enrollment URL for an
 * existing person. This is the out-of-band path when someone has no usable
 * credential (migrating a pre-passkey account, or lost all devices) and no
 * SUPERUSER is available to issue a link through the API.
 *
 * Usage:
 *   docker compose exec trade-directory-service \
 *     npx ts-node -r tsconfig-paths/register \
 *     apps/trade-directory/src/scripts/issue-enrollment-token.ts user@example.com
 */
async function bootstrap() {
  const email = process.argv[2];
  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: issue-enrollment-token.ts <email>');
    process.exit(1);
  }

  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const personRepository = app.get(PersonRepository);
  const enrollmentTokenRepository = app.get(EnrollmentTokenRepository);
  const passkeyService = app.get(PasskeyService);

  const person = await personRepository.findOne({ where: { email } });
  if (!person) {
    // eslint-disable-next-line no-console
    console.error(`No person found with email ${email}`);
    await app.close();
    process.exit(1);
  }

  const rawToken = randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await enrollmentTokenRepository.save(
    new EnrollmentToken({
      person,
      tokenHash: createHash('sha256').update(rawToken).digest('hex'),
      expiresAt,
      usedAt: null,
      createdByPersonId: null,
    }),
  );

  // eslint-disable-next-line no-console
  console.log(`\n=== Passkey enrollment for ${email} (valid 24h, single use) ===`);
  // eslint-disable-next-line no-console
  console.log(passkeyService.buildEnrollmentUrl(rawToken));
  // eslint-disable-next-line no-console
  console.log('===============================================================\n');

  await app.close();
}

bootstrap();
