import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { DocumentStatusEnum } from '@app/common/apps/document-management/enums/document-status.enum';
import { StoredDocument } from '../../../../models/document.entity';

export class DocumentResponseDto {
  documentUuid: string;
  subjectOrganizationId: number;
  documentClass: DocumentClassEnum;
  status: DocumentStatusEnum;
  refId?: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sha256Hash: string;
  createdAt: Date;

  static fromEntity(document: StoredDocument): DocumentResponseDto {
    return {
      documentUuid: document.documentUuid,
      subjectOrganizationId: document.subjectOrganizationId,
      documentClass: document.documentClass,
      status: document.status,
      refId: document.refId,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSizeBytes: document.fileSizeBytes,
      sha256Hash: document.sha256Hash,
      createdAt: document.createdAt,
    };
  }
}

export class PresignedUrlResponseDto {
  documentUuid: string;
  url: string;
  expiresInSeconds: number;
}
