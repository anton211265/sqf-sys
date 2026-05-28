import { Module } from '@nestjs/common';
import { RiskQuantitativeParameterService } from './risk-quantitative-parameter.service';
import { RiskQuantitativeParameterController } from './risk-quantitative-parameter.controller';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';
import { DatabaseModule } from '@app/common/database/database.module';
import { RiskQuantitativeParameter } from '../../models/risk-quantitative-parameter.entity';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([RiskQuantitativeParameter]),
  ],
  controllers: [RiskQuantitativeParameterController],
  providers: [
    RiskQuantitativeParameterService,
    RiskQuantitativeParameterRepository,
  ],
})
export class RiskQuantitativeParameterModule {}
