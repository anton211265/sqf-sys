import { DatabaseModule } from '@app/common/database/database.module';
import { RemotePermissionGuard } from '@app/common/rbac/remote-permission.guard';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  RiskAuditLog,
  RiskProfileChangeRequest,
} from '../../models/risk-governance.entity';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskGovernanceController } from './risk-governance.controller';
import { RiskGovernanceService } from './risk-governance.service';

@Module({
  imports: [
    DatabaseModule.forFeature([
      RiskProfile,
      RiskQuantitativeProfileWeight,
      RiskProfileChangeRequest,
      RiskAuditLog,
    ]),
    // RemotePermissionGuard verifies the JWT locally; permission sets come
    // from trade-directory's manifest (env RBAC_MANIFEST_URL, fail closed).
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RiskGovernanceController],
  providers: [RiskGovernanceService, RemotePermissionGuard],
})
export class RiskGovernanceModule {}
