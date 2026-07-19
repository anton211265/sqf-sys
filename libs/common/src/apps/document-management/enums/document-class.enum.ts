export enum DocumentClassEnum {
  COMPANY_REGISTRY = 'COMPANY_REGISTRY',
  KYC_CREDIT_REPORT = 'KYC_CREDIT_REPORT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  PROOF_OF_ADDRESS = 'PROOF_OF_ADDRESS',
  DIRECTOR_IDENTIFICATION = 'DIRECTOR_IDENTIFICATION',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

// Onboarding classes reject image-only files at upload (no vision fallback) —
// see CLAUDE.md "Planned: Document Management redesign".
export const ONBOARDING_DOCUMENT_CLASSES: readonly DocumentClassEnum[] = [
  DocumentClassEnum.COMPANY_REGISTRY,
  DocumentClassEnum.KYC_CREDIT_REPORT,
  DocumentClassEnum.BANK_STATEMENT,
  DocumentClassEnum.PROOF_OF_ADDRESS,
  DocumentClassEnum.DIRECTOR_IDENTIFICATION,
  DocumentClassEnum.FINANCIAL_STATEMENTS,
];
