// Lifecycle statuses grow as redesign phases land (extraction, validation,
// reconciliation) — stored as varchar, not a Postgres enum, so adding values
// needs no ALTER TYPE.
export enum DocumentStatusEnum {
  UPLOADED = 'UPLOADED',
  EXTRACTING = 'EXTRACTING',
  EXTRACTED = 'EXTRACTED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  VALIDATED = 'VALIDATED',
  DISCREPANCY_FLAGGED = 'DISCREPANCY_FLAGGED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentEventTypeEnum {
  UPLOADED = 'UPLOADED',
  PRESIGNED_URL_ISSUED = 'PRESIGNED_URL_ISSUED',
  EXTRACTION_STARTED = 'EXTRACTION_STARTED',
  EXTRACTION_COMPLETED = 'EXTRACTION_COMPLETED',
  EXTRACTION_FAILED = 'EXTRACTION_FAILED',
  VALIDATION_COMPLETED = 'VALIDATION_COMPLETED',
  DISCREPANCY_FLAGGED = 'DISCREPANCY_FLAGGED',
  DISCREPANCY_CLEARED = 'DISCREPANCY_CLEARED',
}

export enum ExtractionMethodEnum {
  MARKITDOWN = 'markitdown',
  VISION_LLM = 'vision_llm',
}
