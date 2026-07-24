import { DatabaseModule } from '@app/common/database/database.module';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskFactor } from '../../models/risk-factor.entity';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';
import {
  RiskAssessment,
  RiskAssessmentAnswer,
} from '../../models/risk-assessment.entity';
import { RiskAuditLog } from '../../models/risk-governance.entity';
import { CrcController } from './crc.controller';
import { CrcService } from './crc.service';

/**
 * CRC pass 1 (2026-07-24): governed Filter-2 risk model authoring +
 * assessments. Fourth cross-service adopter of the Dynamic RBAC
 * RemotePermissionGuard (needs JWT_SECRET + RBAC_MANIFEST_URL env).
 */
@Module({
  imports: [
    DatabaseModule.forFeature([
      RiskModel,
      RiskFactor,
      RiskHighClassificationFactor,
      RiskAssessment,
      RiskAssessmentAnswer,
      RiskAuditLog,
    ]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CrcController],
  providers: [CrcService, RemotePermissionGuard],
})
export class CrcModule {}
