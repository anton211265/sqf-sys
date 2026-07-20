// Payload of KafkaTopicEnum.INVOICE_EXTRACTION_VALIDATED. Lines are already
// mapped to trade-directory's CreateInvoiceLineDto shape by document-management
// (charge items become taxPercent-0 lines; the extracted absolute tax total is
// spread as a uniform per-line percent) so the consumer maps 1:1 onto
// InvoiceService.create.
export interface InvoiceExtractionValidatedEvent {
  eventId: string;
  documentUuid: string;
  refId?: string;
  uploaderOrgId: number;
  uploadedByPersonId?: number;
  invoice: {
    invoiceNumber: string;
    documentCurrencyCode: string;
    issueDate: string;
    dueDate: string;
    issuerName: string;
    issuerRegistrationNumber?: string | null;
    debtorName: string;
    debtorRegistrationNumber?: string | null;
    lines: {
      itemName: string;
      invoicedQuantity: number;
      priceAmount: number;
      taxPercent: number;
    }[];
  };
}
