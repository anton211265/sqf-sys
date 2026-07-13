import {
  ContractStatusEnum,
  ContractTypeEnum,
  InvoiceStatusEnum,
  InvoiceTypeCodeEnum,
  LendingProductEnum,
  LendingProductSubscriptionStatusEnum,
  RelationshipStatusEnum,
  RelationshipTypeEnum,
  TaxCategoryEnum,
} from 'constants/enum';
import { apiClient } from 'utils/reactQuery';

const TD = '/trade-directory/api';

export interface IDirectoryOrganization {
  id: number;
  organizationName: string;
  country: string;
  malaysiaRegion?: string | null;
  businessRegistrationNumber?: string | null;
  emailAddress?: string | null;
  contactNumber?: string | null;
  fullyOnboardedAt?: string | null;
  createdAt: string;
  personas: {
    isClient: boolean;
    isSupplier: boolean;
    isBuyer: boolean;
    isFunder: boolean;
  };
}

export interface IRelationship {
  id: number;
  funderPersonaId: number;
  fromOrganizationId: number;
  toOrganizationId: number;
  fromOrganization?: { id: number; organizationName: string };
  toOrganization?: { id: number; organizationName: string };
  relationshipType: RelationshipTypeEnum;
  paymentTermsDays?: number | null;
  yearlyVolumeChangePct?: number | null;
  totalTradeVolume?: number | null;
  tradeCurrency?: string | null;
  status: RelationshipStatusEnum;
  updatedAt: string;
}

export interface IContract {
  id: number;
  contractType: ContractTypeEnum;
  firstPartyOrganizationId: number;
  secondPartyOrganizationId: number;
  firstPartyOrganization?: { id: number; organizationName: string };
  secondPartyOrganization?: { id: number; organizationName: string };
  relationshipId?: number | null;
  lendingProduct?: LendingProductEnum | null;
  reference?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contractValue?: number | null;
  currency?: string | null;
  paymentTermsDays?: number | null;
  status: ContractStatusEnum;
  updatedAt: string;
}

// Mirrors the UBL 2.5 Invoice header this table now stores — see
// SQF ARCHITECTURE/SCEHMA/ubl-invoice-{schema.json,data-dictionary.md} and
// docs/design/trade-directory-redesign.md.
export interface IInvoice {
  id: number;
  invoiceNumber: string;
  invoiceTypeCode: InvoiceTypeCodeEnum;
  issuerOrganizationId: number;
  debtorOrganizationId: number;
  issuerOrganization?: { id: number; organizationName: string };
  debtorOrganization?: { id: number; organizationName: string };
  relationshipId?: number | null;
  contractId?: number | null;
  lendingProduct?: LendingProductEnum | null;
  documentCurrencyCode: string;
  issueDate: string;
  dueDate: string;
  lineExtensionAmount: number;
  taxExclusiveAmount: number;
  taxInclusiveAmount: number;
  payableAmount: number;
  status: InvoiceStatusEnum;
  settledAt?: string | null;
  ownershipTransferredAt?: string | null;
  updatedAt: string;
  lines?: IInvoiceLine[];
  taxSubtotals?: IInvoiceTaxSubtotal[];
  supplierParty?: IParty;
  customerParty?: IParty;
}

export interface IInvoiceLine {
  id?: number;
  lineNumber?: string;
  itemName: string;
  itemDescription?: string;
  invoicedQuantity: number;
  invoicedQuantityUnitCode?: string;
  priceAmount: number;
  lineExtensionAmount?: number;
  taxCategoryId?: TaxCategoryEnum;
  taxPercent?: number;
  taxSchemeId?: string;
}

export interface IInvoiceTaxSubtotal {
  taxableAmount: number;
  taxAmount: number;
  taxCategoryId: TaxCategoryEnum;
  taxPercent?: number | null;
  taxSchemeId: string;
}

export interface IParty {
  id: number;
  partyName?: string | null;
  registrationName?: string | null;
  vatNumber?: string | null;
  countryCode?: string | null;
}

export interface ICreateInvoiceBody {
  invoiceNumber: string;
  issuerOrganizationId: number;
  debtorOrganizationId: number;
  relationshipId?: number;
  contractId?: number;
  lendingProduct?: LendingProductEnum;
  invoiceTypeCode?: InvoiceTypeCodeEnum;
  documentCurrencyCode: string;
  issueDate: string;
  dueDate: string;
  buyerReference?: string;
  lines: IInvoiceLine[];
}

export interface ISubscription {
  id: number;
  clientPersonaId: number;
  clientPersona?: { id: number; clientPersonaId: string };
  product: LendingProductEnum;
  facilityContractId?: number | null;
  facilityContract?: { id: number; reference?: string | null };
  status: LendingProductSubscriptionStatusEnum;
  updatedAt: string;
}

// ---- Directory ----
export const getDirectoryOrganizations = () =>
  apiClient
    .get<IDirectoryOrganization[]>(`${TD}/trade-directory/organizations`)
    .then((r) => r.data);

// ---- Relationships ----
export const getRelationships = (organizationId?: number) =>
  apiClient
    .get<IRelationship[]>(`${TD}/relationships`, {
      params: organizationId ? { organizationId } : {},
    })
    .then((r) => r.data);

export const createRelationship = (body: Partial<IRelationship>) =>
  apiClient.post<IRelationship>(`${TD}/relationships`, body).then((r) => r.data);

export const updateRelationship = ({
  id,
  ...body
}: Partial<IRelationship> & { id: number }) =>
  apiClient
    .patch<IRelationship>(`${TD}/relationships/${id}`, body)
    .then((r) => r.data);

// ---- Contracts ----
export const getContracts = (filters?: {
  contractType?: string;
  organizationId?: number;
}) =>
  apiClient
    .get<IContract[]>(`${TD}/contracts`, { params: filters ?? {} })
    .then((r) => r.data);

export const createContract = (body: Partial<IContract>) =>
  apiClient.post<IContract>(`${TD}/contracts`, body).then((r) => r.data);

export const updateContract = ({
  id,
  ...body
}: Partial<IContract> & { id: number }) =>
  apiClient.patch<IContract>(`${TD}/contracts/${id}`, body).then((r) => r.data);

// ---- Invoices ----
export const getInvoices = (filters?: {
  status?: string;
  issuerOrganizationId?: number;
  debtorOrganizationId?: number;
}) =>
  apiClient
    .get<IInvoice[]>(`${TD}/invoices`, { params: filters ?? {} })
    .then((r) => r.data);

export const createInvoice = (body: ICreateInvoiceBody) =>
  apiClient.post<IInvoice>(`${TD}/invoices`, body).then((r) => r.data);

export const updateInvoiceStatus = ({
  id,
  status,
}: {
  id: number;
  status: InvoiceStatusEnum;
}) =>
  apiClient
    .post<IInvoice>(`${TD}/invoices/${id}/status`, { status })
    .then((r) => r.data);

// ---- Lending product subscriptions ----
export const getSubscriptions = (clientPersonaId?: number) =>
  apiClient
    .get<ISubscription[]>(`${TD}/lending-product-subscriptions`, {
      params: clientPersonaId ? { clientPersonaId } : {},
    })
    .then((r) => r.data);

export const createSubscription = (body: {
  clientPersonaId: number;
  product: LendingProductEnum;
  facilityContractId?: number;
}) =>
  apiClient
    .post<ISubscription>(`${TD}/lending-product-subscriptions`, body)
    .then((r) => r.data);

export const updateSubscription = ({
  id,
  ...body
}: {
  id: number;
  status?: LendingProductSubscriptionStatusEnum;
  facilityContractId?: number;
}) =>
  apiClient
    .patch<ISubscription>(`${TD}/lending-product-subscriptions/${id}`, body)
    .then((r) => r.data);
