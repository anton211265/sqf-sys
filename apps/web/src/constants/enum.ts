export enum OrganizationPersonRoleEnum {
  SQFSYS = 'SQFSYS',
  SUPERUSER = 'SUPERUSER',
  CEO = 'CEO',
  COO = 'COO',
  CLIENT_COVERAGE = 'CLIENT_COVERAGE',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS',
  CORPORATE_COMMUNICATIONS = 'CORPORATE_COMMUNICATIONS',
  CRM = 'CRM',
  RISK_ANALYST = 'RISK_ANALYST',
  FINANCE = 'FINANCE',
  SUPERVISOR_APPROVAL = 'SUPERVISOR_APPROVAL',
  MANAGER_APPROVAL = 'MANAGER_APPROVAL',
}

export enum AppActions {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export enum RiskFactorScoreMethodEnum {
  NUMERIC_SCORING = 'NUMERIC_SCORING',
  LABEL_SELECTION = 'LABEL_SELECTION',
  COUNTRY_SELECTION = 'COUNTRY_SELECTION',
  DROPDOWN_SELECTION = 'DROPDOWN_SELECTION',
}

export enum RiskLevelColorEnum {
  LOW_RISK = 'rgba(24, 161, 83, 1)',
  MEDIUM_RISK = 'rgba(255, 188, 36, 1)',
  HIGH_RISK = 'rgba(203, 60, 51, 1)',
}

export enum Token {
  AccessToken = 'access_token',
  RefreshToken = 'refresh_token',
}

export enum WebhookEventType {
  EXTRACTION = 'extraction',
  CONSENSUS_MESSAGING = 'consensus_messaging',
}

export enum WebhookLogStatus {
  FAILED = 'failed',
  SENT = 'sent',
}

export enum LLMProvider {
  DEEPSEEK = 'deepSeek',
}

export enum OnchainStatus {
  PENDING_WEBHOOK = 'pending_webhook',
  FAILED = 'failed',
  COMPLETED = 'completed',
  PARTIAL_COMPLETED = 'partial_completed',
}

export enum DocumentExtractionStatus {
  PENDING_REVIEW = 'pending_review',
  PENDING_LLM_EXTRACTION = 'pending_llm_extraction',
  PENDING_WEBHOOK = 'pending_webhook',
  FAILED = 'failed',
  COMPLETED = 'completed',
  PARTIAL_COMPLETED = 'partial_completed',
}

// ---- Trade directory network (keep in sync with libs/common trade-directory enums) ----

export enum LendingProductEnum {
  AR_FINANCE = 'AR_FINANCE',
  SUPPLY_CHAIN_FINANCE = 'SUPPLY_CHAIN_FINANCE',
  INVOICE_FACTORING = 'INVOICE_FACTORING',
  TERM_LOAN = 'TERM_LOAN',
}

export const LendingProductLabel: Record<LendingProductEnum, string> = {
  [LendingProductEnum.AR_FINANCE]: 'AR Finance',
  [LendingProductEnum.SUPPLY_CHAIN_FINANCE]: 'Supply Chain Finance',
  [LendingProductEnum.INVOICE_FACTORING]: 'Invoice Factoring',
  [LendingProductEnum.TERM_LOAN]: 'Term Loan',
};

export enum RelationshipTypeEnum {
  SUPPLIES_TO = 'SUPPLIES_TO',
}

export enum RelationshipStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ContractTypeEnum {
  FACILITY_AGREEMENT = 'FACILITY_AGREEMENT',
  COMMERCIAL = 'COMMERCIAL',
}

export enum ContractStatusEnum {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum InvoiceStatusEnum {
  UPLOADED = 'UPLOADED',
  VALIDATED = 'VALIDATED',
  APPROVED_FOR_FINANCE = 'APPROVED_FOR_FINANCE',
  PRESENTED = 'PRESENTED',
  FINANCED = 'FINANCED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

// Mirrors InvoiceService.ALLOWED_TRANSITIONS on the backend — drives which
// status actions the register offers per row.
export const InvoiceStatusTransitions: Record<InvoiceStatusEnum, InvoiceStatusEnum[]> = {
  [InvoiceStatusEnum.UPLOADED]: [InvoiceStatusEnum.VALIDATED, InvoiceStatusEnum.REJECTED],
  [InvoiceStatusEnum.VALIDATED]: [InvoiceStatusEnum.APPROVED_FOR_FINANCE, InvoiceStatusEnum.REJECTED],
  [InvoiceStatusEnum.APPROVED_FOR_FINANCE]: [
    InvoiceStatusEnum.PRESENTED,
    InvoiceStatusEnum.FINANCED,
    InvoiceStatusEnum.REJECTED,
  ],
  [InvoiceStatusEnum.PRESENTED]: [InvoiceStatusEnum.FINANCED, InvoiceStatusEnum.CLOSED],
  [InvoiceStatusEnum.FINANCED]: [
    InvoiceStatusEnum.PARTIALLY_PAID,
    InvoiceStatusEnum.PAID,
    InvoiceStatusEnum.OVERDUE,
  ],
  [InvoiceStatusEnum.PARTIALLY_PAID]: [InvoiceStatusEnum.PAID, InvoiceStatusEnum.OVERDUE],
  [InvoiceStatusEnum.OVERDUE]: [InvoiceStatusEnum.PARTIALLY_PAID, InvoiceStatusEnum.PAID],
  [InvoiceStatusEnum.PAID]: [InvoiceStatusEnum.CLOSED],
  [InvoiceStatusEnum.CLOSED]: [],
  [InvoiceStatusEnum.REJECTED]: [],
};

export enum LendingProductSubscriptionStatusEnum {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}
