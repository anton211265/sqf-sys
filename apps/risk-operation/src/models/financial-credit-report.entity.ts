import { AbstractEntity } from '@app/common/database/abstract.entity';
import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FinancialCreditReportTypeEnum } from '@app/common/apps/risk-operation/enums/financial-credit-report-type.enum';
import { ApplicationSupportingDocument } from './application-supporting-document.entity';

@Entity()
export class FinancialCreditReport extends AbstractEntity<FinancialCreditReport> {
  // ------------------ Relationship ------------------

  @ManyToOne(() => ApplicationSupportingDocument, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({ name: 'supporting_document_id' })
  supportingDocument?: ApplicationSupportingDocument;

  // ------------------ Relationship ------------------

  @Index()
  @Column({
    name: 'organization_id',
    type: 'integer',
    nullable: false,
  })
  organizationId: number;

  @Column({ name: 'organization_name', type: 'varchar' })
  organizationName: string;

  @Column({ name: 'supporting_document_id', nullable: true })
  supportingDocumentId: number;

  @Column({ name: 'report_date', nullable: true })
  reportDate?: Date;

  @Column({ name: 'report_year', type: 'int', nullable: true })
  reportYear?: number;

  @Column({
    name: 'report_type',
    type: 'enum',
    enum: FinancialCreditReportTypeEnum,
    enumName: 'FinancialCreditReportTypeEnum',
    default: FinancialCreditReportTypeEnum.YEAR_END,
  })
  reportType: FinancialCreditReportTypeEnum;

  @Column({ name: 'years_of_operation', type: 'integer' })
  yearsOfOperation: number;

  @Column('varchar', { length: 3, nullable: true })
  profitability: string;

  @Column({ name: 'current_ratio', type: 'numeric', nullable: true })
  currentRatio: string;

  @Column({ name: 'total_liabilities', type: 'numeric', nullable: true })
  totalLiabilities: string;

  @Column({ name: 'total_revenue', type: 'numeric', nullable: true })
  totalRevenue: string;

  @Column({ name: 'net_revenue', type: 'numeric', nullable: true })
  netRevenue: string;

  @Column({ name: 'net_profit', type: 'numeric', nullable: true })
  netProfit: string;

  @Column({
    name: 'total_current_liabilities',
    type: 'numeric',
    nullable: true,
  })
  totalCurrentLiabilities: string;

  @Column({ name: 'loan_to_receivable', type: 'numeric', nullable: true })
  loanToReceivable: string;

  @Column({ name: 'total_loan', type: 'numeric', nullable: true })
  totalLoan: string;

  @Column({ name: 'total_current_assets', type: 'numeric', nullable: true })
  totalCurrentAssets: string;

  @Column({ name: 'total_capital', type: 'numeric', nullable: true })
  totalCapital: string;

  @Column({ name: 'net_debt', type: 'numeric', nullable: true })
  netDebt: string;

  @Column({ name: 'total_equity', type: 'numeric', nullable: true })
  totalEquity: string;

  @Column({ name: 'total_debt', type: 'numeric', nullable: true })
  totalDebt: string;

  @Column({ name: 'account_receivables', type: 'numeric', nullable: true })
  accountReceivables: string;

  // Needed by the default risk profile's Quick Ratio sub-parameter
  // ((current assets - inventory) / current liabilities).
  @Column({ type: 'numeric', nullable: true })
  inventory: string;

  @Column({ type: 'numeric', nullable: true })
  ebitda: string;

  @Column({
    name: 'total_equity_and_liabilities',
    type: 'numeric',
    nullable: true,
  })
  totalEquityAndLiabilities: string;

  @Column({ name: 'debt_to_equity', type: 'numeric', nullable: true })
  debtToEquity: string;

  @Column({ name: 'debt_to_ebitda', type: 'numeric', nullable: true })
  debtToEbitda: string;

  @Column({ name: 'debt_to_capital', type: 'numeric', nullable: true })
  debtToCapital: string;

  @Column({ name: 'interest_expense', type: 'numeric', nullable: true })
  interestExpense: string;

  @Column({
    name: 'depreciation_and_amortization',
    type: 'numeric',
    nullable: true,
  })
  depreciationAndAmortization: string;

  @Column({ name: 'retained_cash_flow', type: 'numeric', nullable: true })
  retainedCashFlow: string;

  @Column({ name: 'rcf_to_net_debt', type: 'numeric', nullable: true })
  rcfToNetDebt: string;

  @Column({
    name: 'ebitda_to_interest_expense',
    type: 'numeric',
    nullable: true,
  })
  ebitdaToInterestExpense: string;

  @Column({ name: 'principal_repayment', type: 'numeric', nullable: true })
  principalRepayment: string;

  @Column({
    name: 'debt_service_coverage_ratio',
    type: 'numeric',
    nullable: true,
  })
  debtServiceCoverageRatio: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;
}
