// Lifecycle statuses grow as redesign phases land (extraction, validation,
// reconciliation) — stored as varchar, not a Postgres enum, so adding values
// needs no ALTER TYPE.
export enum DocumentStatusEnum {
  UPLOADED = 'UPLOADED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentEventTypeEnum {
  UPLOADED = 'UPLOADED',
  PRESIGNED_URL_ISSUED = 'PRESIGNED_URL_ISSUED',
}
