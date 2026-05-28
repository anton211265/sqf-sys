import { Module } from '@nestjs/common';
import { OCR_SERVICE } from './ocr.interface';
import { OCRService } from './ocr.service';
import { ConfigService } from '@nestjs/config';
import { TextractClient } from '@aws-sdk/client-textract';

@Module({
  providers: [
    {
      provide: 'TextractClient',
      useFactory: (configService: ConfigService) => {
        const region = configService.getOrThrow('AWS_S3_REGION');
        const accessKeyId = configService.getOrThrow('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.getOrThrow(
          'AWS_SECRET_ACCESS_KEY',
        );

        return new TextractClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: OCR_SERVICE,
      useClass: OCRService,
    },
  ],
  exports: [OCR_SERVICE],
})
export class OCRModule {}
