import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { DatabaseModule } from '@app/common/database/database.module';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { z } from 'zod';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { ProcessedEventRepository } from './processed-event.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([ProcessedEvent]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            EMAIL_HOST: z.string(),
            EMAIL_PORT: z.coerce.number(),
            EMAIL_USER: z.string(),
            EMAIL_PASS: z.string(),
          })
          .parse(config);
      },
    }),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    ProcessedEventRepository,
    {
      provide: DependencyInjectionTokenEnum.EMAIL_TRANSPORTER,
      useFactory: (configService: ConfigService) => {
        return nodemailer.createTransport({
          host: configService.getOrThrow('EMAIL_HOST'),
          port: configService.getOrThrow('EMAIL_PORT'),
          secure: true,
          auth: {
            user: configService.getOrThrow('EMAIL_USER'),
            pass: configService.getOrThrow('EMAIL_PASS'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class EmailModule {}
