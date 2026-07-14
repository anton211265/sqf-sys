export enum KafkaTopicEnum {
  // ---------------------- SQF ----------------------
  SQF_GET_ORGANIZATION_BY_ID = 'sqf_create_organization_by_id',
  SQF_CREATE_ORGANIZATION = 'sqf_create_organization',
  SQF_CREATE_ORGANIZATION_PERSON = 'sqf_create_organization_person',
  SQF_CREATE_APPLICATION_PERSON = 'sqf_create_application_person',
  SQF_GET_ALL_APPLICATIONS = 'sqf_get_all_applications',
  SQF_GET_ORGANIZATION_PERSON_BY_ID = 'sqf_get_organization_person_by_id',
  SQF_GET_APPLICATIONS_BY_ORG_ID = 'sqf_get_applications_by_organization_id',
  SQF_DOCUMENT_EXTRACTION = 'sqf_document_extraction',
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

  REQUEST_KYC_REPORT = 'request_kyc_report',
  RECEIVE_KYC_REPORT = 'receive_kyc_report',
  SEND_EMAIL = 'send_email',
  CREATE_CLIENT_ASSIGNEE = 'create_client_assignee',

  // ---------------------- SQF ----------------------
}
