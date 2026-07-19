import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createHash, randomUUID } from 'crypto';
import {
  DocumentClassEnum,
  ONBOARDING_DOCUMENT_CLASSES,
} from '@app/common/apps/document-management/enums/document-class.enum';
import {
  DocumentEventTypeEnum,
  DocumentStatusEnum,
} from '@app/common/apps/document-management/enums/document-status.enum';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { StoredDocument } from '../../models/document.entity';
import { DocumentEvent } from '../../models/document-event.entity';
import { DocumentRepository } from '../../repositories/document.repository';
import { DocumentEventRepository } from '../../repositories/document-event.repository';
import {
  IMarkitdownService,
  MARKITDOWN_SERVICE,
} from '../markitdown/markitdown.interface';
import { UploadDocumentDto } from './dto/request/upload-document.dto';
import { ListDocumentsDto } from './dto/request/list-documents.dto';
import {
  DocumentResponseDto,
  PresignedUrlResponseDto,
} from './dto/response/document-response.dto';

// Same threshold the extraction pipeline uses to decide a file has no real
// text layer. For onboarding classes that means reject, not vision-fallback.
const MIN_VIABLE_TEXT_LENGTH = 20;

const PRESIGNED_URL_EXPIRY_SECONDS = 15 * 60;

const PDF_MIMETYPE = 'application/pdf';

const SPREADSHEET_MIMETYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Design: onboarding supports CSV, Excel or PDF only — image files rejected.
const ONBOARDING_MIMETYPES = [PDF_MIMETYPE, ...SPREADSHEET_MIMETYPES];

// Invoice/other classes also accept images (vision fallback handles them)
// and Word documents.
const GENERAL_MIMETYPES = [
  ...ONBOARDING_MIMETYPES,
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly bucketName: string;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentEventRepository: DocumentEventRepository,
    @Inject('S3Client') private readonly s3Client: S3Client,
    @Inject(MARKITDOWN_SERVICE)
    private readonly markitdownService: IMarkitdownService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    configService: ConfigService,
  ) {
    this.bucketName = configService.getOrThrow(
      'DOCUMENT_EXTRACTION_BUCKET_NAME',
    );
  }

  async upload(
    user: IUserContext,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
  ): Promise<DocumentResponseDto> {
    const { documentClass, subjectOrganizationId, refId } = dto;
    const { originalname, buffer, mimetype, size } = file;

    const isOnboardingClass =
      ONBOARDING_DOCUMENT_CLASSES.includes(documentClass);

    const allowedMimetypes = isOnboardingClass
      ? ONBOARDING_MIMETYPES
      : GENERAL_MIMETYPES;

    if (!allowedMimetypes.includes(mimetype)) {
      throw new BadRequestException(
        isOnboardingClass
          ? `Unsupported file type "${mimetype}" for onboarding document class ${documentClass}. Supported: PDF, CSV, Excel. Scanned image files are not supported for onboarding.`
          : `Unsupported file type "${mimetype}" for document class ${documentClass}.`,
      );
    }

    // Onboarding PDFs must carry a real text layer — an image-only scan
    // converts to (near-)empty Markdown and is rejected rather than routed
    // to vision transcription.
    let rawText: string | undefined;
    if (isOnboardingClass && mimetype === PDF_MIMETYPE) {
      rawText = await this.markitdownService.convertToMarkdown(
        buffer,
        originalname,
      );
      if (rawText.trim().length < MIN_VIABLE_TEXT_LENGTH) {
        throw new BadRequestException(
          `This PDF appears to be a scanned/image-only document with no selectable text. Scanned documents are not supported for onboarding — upload the original digital document (PDF, CSV or Excel).`,
        );
      }
    }

    const sha256Hash = createHash('sha256').update(buffer).digest('hex');
    const documentUuid = randomUUID();
    const objectKey = `documents/${subjectOrganizationId}/${documentUuid}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: buffer,
        ContentType: mimetype,
        Metadata: { sha256: sha256Hash, filename: originalname },
      }),
    );

    // S3 put happens before the DB transaction: a failed transaction can
    // orphan an S3 object (harmless), but a DB row must never point at a
    // missing object.
    const document = await this.entityManager.transaction(async (manager) => {
      const saved = await manager.save(
        new StoredDocument({
          documentUuid,
          subjectOrganizationId,
          uploaderOrgId: user.orgId,
          uploadedByPersonId: user.id,
          documentClass,
          status: DocumentStatusEnum.UPLOADED,
          refId,
          fileName: originalname,
          mimeType: mimetype,
          fileSizeBytes: size,
          sha256Hash,
          bucketName: this.bucketName,
          objectKey,
          rawText,
        }),
      );

      await manager.save(
        new DocumentEvent({
          documentId: saved.id,
          eventType: DocumentEventTypeEnum.UPLOADED,
          actorPersonId: user.id,
          afterStatus: DocumentStatusEnum.UPLOADED,
          detail: {
            fileName: originalname,
            mimeType: mimetype,
            fileSizeBytes: size,
            sha256Hash,
          },
        }),
      );

      return saved;
    });

    this.logger.log(
      `Document ${documentUuid} (${documentClass}) uploaded for org ${subjectOrganizationId} by person ${user.id}`,
    );

    return DocumentResponseDto.fromEntity(document);
  }

  async list(
    user: IUserContext,
    query: ListDocumentsDto,
  ): Promise<DocumentResponseDto[]> {
    const qb = this.entityManager
      .getRepository(StoredDocument)
      .createQueryBuilder('document')
      .where(
        '(document.subjectOrganizationId = :orgId OR document.uploaderOrgId = :orgId)',
        { orgId: user.orgId },
      )
      .orderBy('document.createdAt', 'DESC');

    if (query.subjectOrganizationId !== undefined) {
      qb.andWhere('document.subjectOrganizationId = :subjectOrgId', {
        subjectOrgId: query.subjectOrganizationId,
      });
    }
    if (query.documentClass) {
      qb.andWhere('document.documentClass = :documentClass', {
        documentClass: query.documentClass,
      });
    }
    if (query.status) {
      qb.andWhere('document.status = :status', { status: query.status });
    }

    const documents = await qb.getMany();
    return documents.map(DocumentResponseDto.fromEntity);
  }

  async getByUuid(
    user: IUserContext,
    documentUuid: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.findVisibleDocument(user, documentUuid);
    return DocumentResponseDto.fromEntity(document);
  }

  async getPresignedUrl(
    user: IUserContext,
    documentUuid: string,
  ): Promise<PresignedUrlResponseDto> {
    const document = await this.findVisibleDocument(user, documentUuid);

    const url = await getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: document.bucketName,
        Key: document.objectKey,
        ResponseContentDisposition: `attachment; filename="${document.fileName.replace(/"/g, '')}"`,
      }),
      { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS },
    );

    await this.documentEventRepository.record({
      documentId: document.id,
      eventType: DocumentEventTypeEnum.PRESIGNED_URL_ISSUED,
      actorPersonId: user.id,
      detail: { expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS },
    });

    return {
      documentUuid: document.documentUuid,
      url,
      expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS,
    };
  }

  // Visibility: the caller's org must be the document's subject or its
  // uploader. Role-based refinement (e.g. Risk Officer cross-org access)
  // arrives with the Dynamic RBAC work.
  private async findVisibleDocument(
    user: IUserContext,
    documentUuid: string,
  ): Promise<StoredDocument> {
    const document = await this.documentRepository.findOne({
      where: { documentUuid },
    });
    if (!document) {
      throw new NotFoundException(`Document ${documentUuid} not found`);
    }

    if (
      document.subjectOrganizationId !== user.orgId &&
      document.uploaderOrgId !== user.orgId
    ) {
      throw new ForbiddenException(
        `Document ${documentUuid} is not accessible to your organization`,
      );
    }

    return document;
  }
}
