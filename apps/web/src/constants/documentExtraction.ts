import { DocumentExtractionStatus } from './enum';

export const EXTRACTION_STATUS_LABELS: Record<
  DocumentExtractionStatus,
  string
> = {
  [DocumentExtractionStatus.COMPLETED]: 'Completed',
  [DocumentExtractionStatus.PENDING_WEBHOOK]: 'Pending Webhook',
  [DocumentExtractionStatus.PARTIAL_COMPLETED]: 'Partial Completed',
  [DocumentExtractionStatus.FAILED]: 'Failed',
  [DocumentExtractionStatus.PENDING_LLM_EXTRACTION]: 'Pending LLM Extraction',
  [DocumentExtractionStatus.PENDING_REVIEW]: 'Pending Review',
};

export const FORMAT_OPTIONS = [
  { value: 'string', label: 'String' },
  { value: 'array', label: 'Array' },
  { value: 'object', label: 'Object' },
  { value: 'number', label: 'Number' },
];
