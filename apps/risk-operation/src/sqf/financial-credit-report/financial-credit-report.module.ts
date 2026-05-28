import { Module } from '@nestjs/common';
import { FinancialCreditReportService } from './financial-credit-report.service';
import { FinancialCreditReportController } from './financial-credit-report.controller';
import { FinancialCreditReportRepository } from '../../repositories/financial-credit-report.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { FinancialCreditReport } from '../../models/financial-credit-report.entity';
import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [DatabaseModule, DatabaseModule.forFeature([FinancialCreditReport])],
  controllers: [FinancialCreditReportController],
  providers: [
    FinancialCreditReportService,
    FinancialCreditReportRepository,
    {
      provide: 'S3Client',
      useFactory: (configService: ConfigService) => {
        const region = configService.get('AWS_S3_REGION');
        const accessKeyId = configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = configService.get('AWS_SECRET_ACCESS_KEY');

        return new S3Client({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
      },
      inject: [ConfigService],
    },
  ],
})
export class FinancialCreditReportModule {}
