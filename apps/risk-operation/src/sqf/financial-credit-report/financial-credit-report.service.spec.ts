import { Test, TestingModule } from '@nestjs/testing';
import { FinancialCreditReportService } from './financial-credit-report.service';

describe('FinancialCreditReportService', () => {
  let service: FinancialCreditReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialCreditReportService],
    }).compile();

    service = module.get<FinancialCreditReportService>(FinancialCreditReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
