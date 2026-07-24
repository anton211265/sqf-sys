export enum KafkaTopicEnum {
  // ---------------------- SQF ----------------------
  SQF_GET_ORGANIZATION_BY_ID = 'sqf_create_organization_by_id',
  SQF_CREATE_ORGANIZATION = 'sqf_create_organization',
  SQF_CREATE_ORGANIZATION_PERSON = 'sqf_create_organization_person',
  SQF_CREATE_APPLICATION_PERSON = 'sqf_create_application_person',
  SQF_GET_ALL_APPLICATIONS = 'sqf_get_all_applications',
  SQF_GET_ORGANIZATION_PERSON_BY_ID = 'sqf_get_organization_person_by_id',
  SQF_GET_APPLICATIONS_BY_ORG_ID = 'sqf_get_applications_by_organization_id',
  APPLICATION_SUBMITTED_FOR_REVIEW = 'application_submitted_for_review',
  AUTHENTICATE = 'authenticate',
  AUTHENTICATE_REPLY = 'authenticate.reply',

  // Trade-network events (consumed by the future knowledge-graph service)
  RELATIONSHIP_UPSERTED = 'relationship_upserted',
  CONTRACT_UPSERTED = 'contract_upserted',
  INVOICE_STATUS_CHANGED = 'invoice_status_changed',
  // Emitted when invoice creation auto-creates a bare Organization for an
  // issuer/debtor that didn't exist yet. Consumed by risk-agent's
  // organization-kyc module, which runs an LLM KYC-intake task and proposes
  // a CLEAR/FLAGGED outcome for a Human Risk Analyst to confirm (see
  // apps/risk-agent/src/organization-kyc, CLAUDE.md).
  ORGANIZATION_CREATED = 'organization_created',

  // Emitted by document-management (outbox) when Claude field extraction
  // completes on an uploaded document. Consumers filter by documentClass:
  // risk-operation ingests FINANCIAL_STATEMENTS into financial_credit_report;
  // trade-directory answers COMPANY_REGISTRY with DOCUMENT_VALIDATION_DATA.
  DOCUMENT_EXTRACTED = 'document_extracted',
  // trade-directory's reply to a COMPANY_REGISTRY extraction: a snapshot of
  // the stored organization + director names, which document-management
  // cross-validates against the extracted fields (deterministic-first,
  // Claude for fuzzy cases) to flag discrepancies for the Risk Officer.
  DOCUMENT_VALIDATION_DATA = 'document_validation_data',
  // Emitted by document-management (outbox) when an extracted invoice passes
  // the deterministic arithmetic gate (or is manually reconciled by the
  // Finance Analyst). trade-directory consumes it into the existing
  // lines-only invoice-create path (InvoiceService.create).
  INVOICE_EXTRACTION_VALIDATED = 'invoice_extraction_validated',

  // Emitted by product-configurator (outbox). No consumers yet — future
  // candidates: trade-directory (lending_product_subscription sync) and
  // knowledge-graph (projecting product/pricing facts).
  RATE_CARD_PUBLISHED = 'rate_card_published',
  PRODUCT_ASSIGNMENT_CREATED = 'product_assignment_created',

  // SLA firing engine (product-configurator). Business flows START/CANCEL
  // timers through their own outbox; the engine emits SLA_BREACHED when a
  // RUNNING timer passes its deadline (plus SEND_EMAIL when the start
  // payload carried notifyEmail). Every message needs a top-level eventId.
  SLA_TIMER_START = 'sla_timer_start',
  SLA_TIMER_CANCEL = 'sla_timer_cancel',
  SLA_BREACHED = 'sla_breached',

  REQUEST_KYC_REPORT = 'request_kyc_report',
  RECEIVE_KYC_REPORT = 'receive_kyc_report',
  SEND_EMAIL = 'send_email',
  CREATE_CLIENT_ASSIGNEE = 'create_client_assignee',

  // ---------------------- SQF ----------------------
}
