import { DocumentExtractionInternalType } from 'apps/document-management/src/models/document-extraction.entity';

export interface DocumentExtractionKafkaRequest {
  eventId: string;
  fileName: string;
  file: Buffer;
  templateId: string;
  documentType: DocumentExtractionInternalType;
  refId: string;
  orgId: string;
  mimetype: string;
}
