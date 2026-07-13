import { KycAgencyEnum } from '@app/common/apps/trade-directory/enums/kyc-agency.enum';
import { KycReportSourceEnum } from '@app/common/apps/trade-directory/enums/kyc-report-source.enum';
import { KycReportStatusEnum } from '@app/common/apps/trade-directory/enums/kyc-report-status.enum';
import { KycReportTypeEnum } from '@app/common/apps/trade-directory/enums/kyc-report-type.enum';
import { AbstractEntity } from '@app/common/database/abstract.entity';
import { NumericTransformer } from '@app/common/utils/numeric-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Person } from './person.entity';

@Entity()
export class KycAgencyReport extends AbstractEntity<KycAgencyReport> {
  // Which KYC agency produced this report. Reports are agency-specific payloads;
  // new agencies extend KycAgencyEnum rather than adding new report tables.
  @Column({
    type: 'enum',
    enum: KycAgencyEnum,
    enumName: 'KycAgencyEnum',
    default: KycAgencyEnum.EXPERIAN,
  })
  agency: KycAgencyEnum;

  @ManyToOne(
    () => Organization,
    (organization) => organization.kycAgencyReports,
    {
      cascade: ['insert', 'update'],
    },
  )
  organization?: Organization;

  @RelationId((kycReport: KycAgencyReport) => kycReport.organization)
  @Column({ nullable: true })
  organizationId: number;

  @ManyToOne(() => Person, (person) => person.kycAgencyReports, {
    cascade: ['insert', 'update'],
  })
  person?: Person;

  @RelationId((kycReport: KycAgencyReport) => kycReport.person)
  @Column({ nullable: true })
  personId: number;

  @Column({
    type: 'enum',
    enum: KycReportTypeEnum,
    enumName: 'KycReportTypeEnum',
  })
  reportType: KycReportTypeEnum;

  @Column({
    type: 'enum',
    enum: KycReportStatusEnum,
    enumName: 'KycReportStatusEnum',
  })
  reportStatus: KycReportStatusEnum;

  @Column({
    type: 'enum',
    enum: KycReportSourceEnum,
    enumName: 'KycReportSourceEnum',
  })
  reportSource: KycReportSourceEnum;

  @Column({ type: 'varchar', nullable: true })
  token1?: string;

  @Column({ type: 'varchar', nullable: true })
  token2?: string;

  @Column({ type: 'varchar', nullable: true })
  xml?: string;
  xmlJson?: any;

  @Column({ type: 'jsonb', nullable: true })
  error?: any;

  @Column({ type: 'varchar', nullable: true })
  registrationNumber?: string;

  @Column({ type: 'varchar', nullable: true })
  companyName?: string;

  @Column({ type: 'varchar', nullable: true })
  type?: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  incorporationDate?: Date;

  @Column({ type: 'varchar', nullable: true })
  status?: string;

  @Column({ type: 'varchar', nullable: true })
  businessAddress?: string;

  @Column({ type: 'jsonb', nullable: true })
  registeredAddress?: {
    address?: string;
    dateCaptured?: string;
  }[];

  @Column({ type: 'varchar', nullable: true })
  businessConstitution?: string;

  @Column({ type: 'varchar', nullable: true })
  businessSector?: string;

  @Column({ type: 'varchar', nullable: true })
  principalActivity?: string;

  @Column({ type: 'timestamp without time zone', nullable: true })
  lastFinancialFiled?: Date;

  @Column({ type: 'varchar', nullable: true })
  natureOfBusiness?: string;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  shareCapitalTotalIssued?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  shareCapitalCash?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  shareCapitalOtherwiseThanCash?: number;

  @Column({ type: 'jsonb', nullable: true })
  managementDetails?: {
    name?: string;
    address?: string;
    localNumber?: string;
    designation?: string;
    appointmentDate?: string;
    withdrawnDate?: string;
    remark?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  shareholders?: {
    name?: string;
    address?: string;
    localNumber?: string;
    shareholdingPercentage?: number;
    percentage?: number;
    asAt?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  companyCharges?: {
    chargeNumber?: string;
    totalOfCharge?: string;
    dateOfCreation?: string;
    nameOfChargee?: string;
    chargeStatus?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  interestInOtherCompanies?: {
    localNumber?: string;
    company?: string;
    shareholding?: string;
    shareholdingPercentage?: number;
    remark?: string;
    asAt?: string;
  }[];

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  nonCurrentAssets?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  currentAssets?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  totalAssets?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  accumulatedProfitCarriedForward?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  totalEquity?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  nonCurrentLiabilities?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  currentLiabilities?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  totalLiabilities?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  totalEquityAndLiabilities?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  revenue?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  profitBeforeTax?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  profitAfterTax?: number;

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  currentRatio?: number;

  @Column({ type: 'jsonb', nullable: true })
  legalSuitsSubjectAsDefendant?: {
    defendantName?: string;
    defendantLocalNumber?: string;
    plaintiffName?: string;
    plaintiffLocalNumber?: string;
    caseStatus?: string;
    hearingDate?: string;
    suitRef?: string;
    // summonDate?: string;
    // jicDate?: string;
    // jidDate?: string;
    // amountClaimed?: string;
    // claimCategory?: string;
    // withdrawnDate?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  legalSuitsSubjectAsPlaintiff?: {
    plaintiffName?: string;
    plaintiffLocalNumber?: string;
    caseStatus?: string;
    hearingDate?: string;
    suitRef?: string;
    // summonDate?: string;
    // amountClaimed?: string;
    // claimCategory?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  windingUpActionSubjectAsDefendant?: {
    defendantName?: string;
    defendantLocalNumber?: string;
    caseNumber?: string;
    courtType?: string;
    solicitorAddress?: string;
    // formerName?: string;
    // petitionersSolicitor?: string;
    // solicitorTelephone?: string;
    // solicitorEmail?: string;
    // solicitorFax?: string;
    // solicitorRef?: string;
    // hearingDate?: string;
    // petitionDate?: string;
    // petitionRef?: string;
    // noticeDate?: string;
    // noticeRef?: string;
    // struckOffDate?: string;
    // struckOffRef?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  windingUpActionSubjectAsPetitioner?: {
    petitionerName?: string;
    petitionerLocalNumber?: string;
    caseNumber?: string;
    courtType?: string;
    solicitorAddress?: string;
    defendantName?: string;
    defendantLocalNumber?: string;
    // petitionersSolicitor?: string;
    // solicitorTelephone?: string;
    // solicitorEmail?: string;
    // solicitorFax?: string;
    // solicitorRef?: string;
    // hearingDate?: string;
    // petitionDate?: string;
    // petitionRef?: string;
    // woundUpDate?: string;
    // woundUpRef?: string;
    // caseStatus?: string;
    // asAtDate?: string;
  }[];

  @Column({
    type: 'numeric',
    nullable: true,
    transformer: new NumericTransformer(),
  })
  iScore?: number;

  @Column({ type: 'jsonb', nullable: true })
  summaryCreditInformation?: any;

  @Column({ type: 'jsonb', nullable: true })
  detailedCreditReport?: {
    facility?: string;
    totalOutstandingBalance?: number;
    dateBalanceUpdated?: string;
    limitInstallmentAmount?: number;
    printRepaymentTerm?: string;
    colType?: string;
    conductOfAccount?: Record<string, Record<string, string>>;
  }[];

  @Column({ type: 'varchar', nullable: true })
  latestThreeApprovedFacilities?: string;

  @Column({ type: 'varchar', nullable: true })
  securedFacilities?: string;

  @Column({ type: 'varchar', nullable: true })
  unsecuredFacilities?: string;

  @Column({ type: 'varchar', nullable: true })
  creditCard?: string;

  @Column({ type: 'varchar', nullable: true })
  otherRevolvingCredits?: string;

  @Column({ type: 'varchar', nullable: true })
  chargeCard?: string;

  @Column({ type: 'varchar', nullable: true })
  nationalHigherEducationFinancing?: string;

  @Column({ type: 'varchar', nullable: true })
  localLenders?: string;

  @Column({ type: 'varchar', nullable: true })
  foreignLenders?: string;

  // @Column({ type: 'varchar', nullable: true })
  // riskGrade: string;

  // @Column({ type: 'varchar', nullable: true })
  // creditApplicationApprovedPastTwelveMonths: string;

  // @Column({ type: 'varchar', nullable: true })
  // creditApplicationPending: string;

  // @Column({ type: 'varchar', nullable: true })
  // specialAttentionAccount: string;

  // @Column({ type: 'varchar', nullable: true })
  // legalActionTaken: string;

  // @Column({ type: 'integer', nullable: true })
  // existingNumberOfFacilities: number;

  // @Column({ type: 'varchar', nullable: true })
  // windingUpRecord: string;

  // @Column({ type: 'varchar', nullable: true })
  // legalSuit: string;

  // @Column({ type: 'varchar', nullable: true })
  // tradeCreditReference: string;

  // @Column({ type: 'varchar', nullable: true })
  // totalEnquiriesPastTwelveMonths: string;

  // @Column({ type: 'varchar', nullable: true })
  // totalBusinessInterest: string;

  // @Column({ type: 'varchar', nullable: true })
  // principalActivity: string;

  // @Column({ type: 'varchar', nullable: true })
  // earliestApprovedFacilities: string;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    default: () => 'LOCALTIMESTAMP',
    onUpdate: 'LOCALTIMESTAMP',
  })
  updatedAt: Date;

  toString(): string {
    return JSON.stringify(this);
  }
}
