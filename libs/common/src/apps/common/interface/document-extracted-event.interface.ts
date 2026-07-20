import { DocumentClassEnum } from '../../document-management/enums/document-class.enum';
import { ExtractionMethodEnum } from '../../document-management/enums/document-status.enum';

// Payload of KafkaTopicEnum.DOCUMENT_EXTRACTED. extractedData's shape is
// class-specific — see apps/document-management/.../extraction-targets.ts.
export interface DocumentExtractedEvent {
  eventId: string;
  documentUuid: string;
  subjectOrganizationId: number;
  documentClass: DocumentClassEnum;
  refId?: string;
  extractionMethod: ExtractionMethodEnum;
  sha256Hash: string;
  extractedData: Record<string, unknown>;
}
