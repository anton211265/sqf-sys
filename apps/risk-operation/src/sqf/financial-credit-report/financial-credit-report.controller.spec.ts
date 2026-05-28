import { Test, TestingModule } from '@nestjs/testing';
import { FinancialCreditReportController } from './financial-credit-report.controller';
import { FinancialCreditReportService } from './financial-credit-report.service';

describe('FinancialCreditReportController', () => {
  let controller: FinancialCreditReportController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FinancialCreditReportController],
      providers: [FinancialCreditReportService],
    }).compile();

    controller = module.get<FinancialCreditReportController>(FinancialCreditReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
