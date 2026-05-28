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
  AUTHENTICATE = 'authenticate',
  AUTHENTICATE_REPLY = 'authenticate.reply',

  // ---------------------- SQF ----------------------

  // ---------------------- LCM ----------------------

  REQUEST_EXPERIAN_REPORT = 'request_experian_report',
  RECEIVE_EXPERIAN_REPORT = 'receive_experian_report',
  SEND_EMAIL = 'send_email',
  CREATE_ORGANIZATION = 'create_organization',
  CREATE_ORGANIZATION_REPLY = 'create_organization.reply',
  UPDATE_ORGANIZATION = 'update_organization',
  UPDATE_ORGANIZATION_REPLY = 'update_organization.reply',
  CREATE_CLIENT_ASSIGNEE = 'create_client_assignee',

  // ---------------------- LCM ----------------------
}
