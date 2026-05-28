import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { AwsS3Service } from './aws-s3.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            AWS_ACCESS_KEY_ID: z.string(),
            AWS_SECRET_ACCESS_KEY: z.string(),
            AWS_S3_REGION: z.string(),
          })
          .parse(config);
      },
    }),
  ],
  providers: [
    AwsS3Service,
    {
      provide: DependencyInjectionTokenEnum.AWS_S3_CLIENT,
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          region: configService.getOrThrow('AWS_S3_REGION'),
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [AwsS3Service],
})
export class AwsS3Module {}
