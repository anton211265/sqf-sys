// Customer Portal pass 1 — onboarding funnel types.

export interface OnboardingConfig {
  funderOrganizationId: number;
  disclaimer: { documentCode: string; body: string; hash: string };
  corporateEmailMode: 'BLOCK' | 'FLAG_ONLY';
  bankCountryMatchMode: 'HARD_BLOCK' | 'FLAG_ONLY';
  activeProducts: { productCode: string; productName: string }[];
}

export interface RegisterInput {
  email: string;
  contactName: string;
  companyName: string;
  businessRegistrationNumber?: string;
  country: string;
  disclaimerCode: string;
  disclaimerHash: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

export interface UploadedDoc {
  uuid: string;
  fileName: string;
}

export interface ApplicationPayload {
  companyProfile?: {
    companyName?: string;
    businessRegistrationNumber?: string;
    country?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    directors?: { name: string }[];
  };
  applicationForm?: Record<string, any>;
  documents?: Record<string, UploadedDoc[]>;
  bankAccount?: {
    beneficiaryName?: string;
    iban?: string;
    swift?: string;
    bankName?: string;
  };
  directors?: { name: string; passportDocUuid?: string; passportFileName?: string }[];
  eResolutionDocUuid?: string;
  eResolutionFileName?: string;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCORED_PASS'
  | 'SCORED_FAIL'
  | 'IN_CRC_REVIEW'
  | 'CLOSED_ARCHIVED';

export interface ClientApplication {
  id: number;
  applicationNumber: string;
  status: ApplicationStatus;
  productCode: string | null;
  payload: ApplicationPayload;
  submittedAt: string | null;
  scoredAt: string | null;
  outcome: 'UNDER_REVIEW' | 'ADDITIONAL_REVIEW_REQUIRED' | 'CLOSED' | null;
  updatedAt: string;
}

/** Required KYC document classes per product — mirrors the server's static
 * v1 map (REQUIRED_DOCUMENT_CLASSES in risk-operation). */
export const REQUIRED_DOCUMENT_CLASSES: Record<string, { class: string; label: string }[]> = {
  AR: [
    { class: 'COMPANY_REGISTRY', label: 'Business registration / company registry extract' },
    { class: 'FINANCIAL_STATEMENTS', label: 'Audited financial statements (latest + prior year)' },
    { class: 'BANK_STATEMENT', label: 'Company bank statements (recent months)' },
    { class: 'PROOF_OF_ADDRESS', label: 'Proof of business address' },
  ],
  IF: [
    { class: 'COMPANY_REGISTRY', label: 'Business registration / company registry extract' },
    { class: 'FINANCIAL_STATEMENTS', label: 'Audited financial statements (latest + prior year)' },
    { class: 'BANK_STATEMENT', label: 'Company bank statements (recent months)' },
    { class: 'PROOF_OF_ADDRESS', label: 'Proof of business address' },
  ],
  SCF: [
    { class: 'COMPANY_REGISTRY', label: 'Business registration / company registry extract' },
    { class: 'FINANCIAL_STATEMENTS', label: 'Audited financial statements (latest + prior year)' },
    { class: 'BANK_STATEMENT', label: 'Company bank statements (recent months)' },
    { class: 'PROOF_OF_ADDRESS', label: 'Proof of business address' },
  ],
  TL: [
    { class: 'COMPANY_REGISTRY', label: 'Business registration / company registry extract' },
    { class: 'FINANCIAL_STATEMENTS', label: 'Audited financial statements (latest + prior year)' },
    { class: 'BANK_STATEMENT', label: 'Company bank statements (recent months)' },
    { class: 'PROOF_OF_ADDRESS', label: 'Proof of business address' },
  ],
};

/** Product-specific application form fields (blueprint §1 parameter sets). */
export const PRODUCT_FORM_FIELDS: Record<string, { key: string; label: string; type: 'number' | 'text' | 'select'; options?: string[] }[]> = {
  AR: [
    { key: 'monthlyRevenue', label: 'Average monthly revenue', type: 'number' },
    { key: 'financingVolume', label: 'Desired financing volume', type: 'number' },
    { key: 'averageInvoiceSize', label: 'Average invoice size', type: 'number' },
    { key: 'clientBase', label: 'Client base', type: 'select', options: ['B2B', 'B2G', 'Mixed B2B/B2G'] },
    { key: 'customerConcentrationPct', label: 'Largest customer % of revenue', type: 'number' },
    { key: 'paymentTerms', label: 'Standard payment terms offered', type: 'select', options: ['Net 30', 'Net 60', 'Net 90'] },
  ],
  IF: [
    { key: 'monthlyRevenue', label: 'Average monthly revenue', type: 'number' },
    { key: 'financingVolume', label: 'Total value of invoices to factor', type: 'number' },
    { key: 'averageInvoiceSize', label: 'Average invoice size', type: 'number' },
    { key: 'clientBase', label: 'Client base', type: 'select', options: ['B2B', 'B2G', 'Mixed B2B/B2G'] },
    { key: 'customerConcentrationPct', label: 'Largest customer % of revenue', type: 'number' },
    { key: 'paymentTerms', label: 'Standard payment terms offered', type: 'select', options: ['Net 30', 'Net 60', 'Net 90'] },
  ],
  SCF: [
    { key: 'monthlyRevenue', label: 'Average monthly revenue', type: 'number' },
    { key: 'financingVolume', label: 'Approved supplier invoice volume (monthly)', type: 'number' },
    { key: 'supplierCount', label: 'Number of suppliers to onboard', type: 'number' },
    { key: 'paymentTerms', label: 'Standard supplier payment terms', type: 'select', options: ['Net 30', 'Net 60', 'Net 90'] },
  ],
  TL: [
    { key: 'fundingAmount', label: 'Total capital requested', type: 'number' },
    { key: 'loanTermMonths', label: 'Preferred repayment period (months)', type: 'select', options: ['12', '36', '60'] },
    { key: 'useOfProceeds', label: 'Use of proceeds', type: 'text' },
  ],
};
