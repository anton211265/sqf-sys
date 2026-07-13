// Superset across the four lending-product flows (AR / SCF / IF / TL);
// each flow uses the subset it needs. Transitions are enforced in
// InvoiceService.ALLOWED_TRANSITIONS — update both together.
export enum InvoiceStatusEnum {
  UPLOADED = 'UPLOADED',
  VALIDATED = 'VALIDATED',
  APPROVED_FOR_FINANCE = 'APPROVED_FOR_FINANCE',
  PRESENTED = 'PRESENTED', // SCF: approved payables presented to the supplier
  FINANCED = 'FINANCED', // funds advanced / receivable purchased
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}
