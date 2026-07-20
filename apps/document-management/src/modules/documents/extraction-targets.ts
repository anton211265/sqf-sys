import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';

// Per-class extraction targets. Each entry describes the JSON shape Claude
// must return for that document class. Field names are chosen to line up
// with their eventual destinations:
// - FINANCIAL_STATEMENTS → risk-operation's financial_credit_report columns
//   (the default risk profile's scoring inputs — latest + prior fiscal year,
//   since Revenue Growth Rate and Profit Margin Trend need both).
// - COMPANY_REGISTRY / DIRECTOR_IDENTIFICATION → trade-directory's
//   organization / person records (cross-validation in Phase 4).
// - INVOICE → the UBL-shaped lines-only invoice-create path (math gate in
//   Phase 5 compares computed totals against statedPayableAmount).
//
// Every target's rules: unknown/absent values are null, never guessed;
// amounts are plain numbers (no thousands separators); dates are ISO 8601
// (YYYY-MM-DD); currency is the ISO 4217 code.

export interface ExtractionTarget {
  description: string;
  jsonShape: string;
}

export const EXTRACTION_TARGETS: Partial<
  Record<DocumentClassEnum, ExtractionTarget>
> = {
  [DocumentClassEnum.COMPANY_REGISTRY]: {
    description:
      'a company registry / certificate of incorporation document proving legal, active existence',
    jsonShape: `{
  "companyName": string | null,
  "registrationNumber": string | null,
  "incorporationDate": string | null,
  "companyStatus": string | null,
  "registeredAddress": string | null,
  "country": string | null,
  "businessActivity": string | null,
  "directors": [{ "fullName": string, "idNumber": string | null }]
}`,
  },
  [DocumentClassEnum.KYC_CREDIT_REPORT]: {
    description: 'a KYC / credit bureau report on a company',
    jsonShape: `{
  "companyName": string | null,
  "registrationNumber": string | null,
  "creditScore": number | null,
  "creditRating": string | null,
  "reportDate": string | null,
  "reportProvider": string | null,
  "adverseFindings": [string],
  "directors": [{ "fullName": string, "idNumber": string | null }],
  "shareholders": [{ "name": string, "sharePercent": number | null }]
}`,
  },
  [DocumentClassEnum.BANK_STATEMENT]: {
    description: 'a company bank statement',
    jsonShape: `{
  "accountHolderName": string | null,
  "bankName": string | null,
  "accountNumber": string | null,
  "currency": string | null,
  "statementPeriodStart": string | null,
  "statementPeriodEnd": string | null,
  "openingBalance": number | null,
  "closingBalance": number | null,
  "totalCredits": number | null,
  "totalDebits": number | null
}`,
  },
  [DocumentClassEnum.PROOF_OF_ADDRESS]: {
    description:
      'a company proof-of-address document (utility bill, tenancy agreement, bank letter)',
    jsonShape: `{
  "companyName": string | null,
  "address": string | null,
  "country": string | null,
  "documentDate": string | null,
  "issuer": string | null,
  "documentKind": string | null
}`,
  },
  [DocumentClassEnum.DIRECTOR_IDENTIFICATION]: {
    description:
      'a personal identification document for a company director (passport or driving licence)',
    jsonShape: `{
  "fullName": string | null,
  "idType": "PASSPORT" | "DRIVING_LICENCE" | "NATIONAL_ID" | null,
  "idNumber": string | null,
  "nationality": string | null,
  "dateOfBirth": string | null,
  "expiryDate": string | null,
  "issuingCountry": string | null
}`,
  },
  [DocumentClassEnum.FINANCIAL_STATEMENTS]: {
    description:
      'company financial statements (profit & loss and balance sheet), possibly covering multiple fiscal years',
    jsonShape: `{
  "companyName": string | null,
  "currency": string | null,
  "fiscalYears": [{
    "fiscalYear": number,
    "totalRevenue": number | null,
    "netProfit": number | null,
    "totalCurrentAssets": number | null,
    "totalCurrentLiabilities": number | null,
    "inventory": number | null,
    "accountReceivables": number | null,
    "totalDebt": number | null,
    "totalEquity": number | null,
    "ebitda": number | null,
    "interestExpense": number | null,
    "totalAssets": number | null
  }]
}`,
  },
  [DocumentClassEnum.INVOICE]: {
    description: 'a commercial invoice',
    jsonShape: `{
  "invoiceNumber": string | null,
  "issuerName": string | null,
  "issuerRegistrationNumber": string | null,
  "debtorName": string | null,
  "debtorRegistrationNumber": string | null,
  "issueDate": string | null,
  "dueDate": string | null,
  "currency": string | null,
  "lines": [{
    "description": string,
    "quantity": number | null,
    "unitPrice": number | null,
    "lineExtensionAmount": number | null
  }],
  "taxTotal": number | null,
  "additionalCharges": [{ "description": string, "amount": number }],
  "statedPayableAmount": number | null
}`,
  },
  // DocumentClassEnum.OTHER has no extraction target — the processor skips it.
};
