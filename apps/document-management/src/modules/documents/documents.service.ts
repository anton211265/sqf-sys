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
import { DocumentValidationDataEvent } from '@app/common/apps/common/interface/document-validation-data-event.interface';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { CrossValidationService } from './cross-validation.service';
import { InvoiceMathService } from './invoice-math.service';
import { OutboxEventRepository } from '../../repositories/outbox-event.repository';
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
    private readonly crossValidationService: CrossValidationService,
    private readonly invoiceMathService: InvoiceMathService,
    private readonly outboxEventRepository: OutboxEventRepository,
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

  // Consumes trade-directory's stored-organization snapshot: runs the
  // deterministic-first comparison and flips the document to VALIDATED or
  // DISCREPANCY_FLAGGED (Risk Officer clears the latter via the API below).
  async applyValidationData(event: DocumentValidationDataEvent): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { documentUuid: event.documentUuid },
    });
    if (!document) {
      this.logger.warn(
        `Validation data for unknown document ${event.documentUuid} — ignoring`,
      );
      return;
    }
    if (document.status !== DocumentStatusEnum.EXTRACTED) {
      this.logger.warn(
        `Validation data for document ${event.documentUuid} in status ${document.status} — ignoring`,
      );
      return;
    }

    const result = await this.crossValidationService.validateCompanyRegistry(
      document.extractedData ?? {},
      event,
    );

    const newStatus = result.hasDiscrepancies
      ? DocumentStatusEnum.DISCREPANCY_FLAGGED
      : DocumentStatusEnum.VALIDATED;

    await this.entityManager.transaction(async (manager) => {
      await manager.update(
        StoredDocument,
        { id: document.id },
        {
          status: newStatus,
          validationResult: result as unknown as Record<string, unknown>,
        },
      );
      await this.documentEventRepository.record(
        {
          documentId: document.id,
          eventType: result.hasDiscrepancies
            ? DocumentEventTypeEnum.DISCREPANCY_FLAGGED
            : DocumentEventTypeEnum.VALIDATION_COMPLETED,
          beforeStatus: DocumentStatusEnum.EXTRACTED,
          afterStatus: newStatus,
          detail: {
            organizationFound: result.organizationFound,
            discrepancyFields: result.fields
              .filter(
                (f) =>
                  f.verdict === 'MISMATCH' || f.verdict === 'MISSING_IN_RECORD',
              )
              .map((f) => f.field),
          },
        },
        manager,
      );
    });

    this.logger.log(
      `Document ${event.documentUuid} validation: ${newStatus} (${result.fields.length} fields compared)`,
    );
  }

  // Backend for the Applicant-list discrepancy view (screens held for the
  // storyboard). Intended for the Risk Officer role once dynamic RBAC lands.
  async listDiscrepancies(user: IUserContext): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.find({
      where: {
        status: DocumentStatusEnum.DISCREPANCY_FLAGGED,
        subjectOrganizationId: user.orgId,
      },
      order: { createdAt: 'DESC' },
    });
    return documents.map(DocumentResponseDto.fromEntity);
  }

  async getValidationResult(
    user: IUserContext,
    documentUuid: string,
  ): Promise<Record<string, unknown>> {
    const document = await this.findVisibleDocument(user, documentUuid);
    return document.validationResult ?? {};
  }

  // Risk Officer clears flagged discrepancies after review (intended role
  // per design; enforced once dynamic RBAC lands). Audited with actor+note.
  async clearDiscrepancies(
    user: IUserContext,
    documentUuid: string,
    note?: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.findVisibleDocument(user, documentUuid);
    if (document.status !== DocumentStatusEnum.DISCREPANCY_FLAGGED) {
      throw new BadRequestException(
        `Document ${documentUuid} has no flagged discrepancies to clear (status ${document.status})`,
      );
    }

    await this.entityManager.transaction(async (manager) => {
      await manager.update(
        StoredDocument,
        { id: document.id },
        { status: DocumentStatusEnum.VALIDATED },
      );
      await this.documentEventRepository.record(
        {
          documentId: document.id,
          eventType: DocumentEventTypeEnum.DISCREPANCY_CLEARED,
          actorPersonId: user.id,
          beforeStatus: DocumentStatusEnum.DISCREPANCY_FLAGGED,
          afterStatus: DocumentStatusEnum.VALIDATED,
          detail: { note: note ?? null },
        },
        manager,
      );
    });

    document.status = DocumentStatusEnum.VALIDATED;
    return DocumentResponseDto.fromEntity(document);
  }

  // Finance Analyst (AR specialist) reconciliation queue — invoices that
  // failed the arithmetic gate. Role enforcement lands with dynamic RBAC.
  async listInvoiceMismatches(
    user: IUserContext,
  ): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.find({
      where: {
        status: DocumentStatusEnum.INVOICE_MISMATCH,
        uploaderOrgId: user.orgId,
      },
      order: { createdAt: 'DESC' },
    });
    return documents.map(DocumentResponseDto.fromEntity);
  }

  // Manual reconciliation: the Finance Analyst corrects the extracted
  // numbers; the corrected data must itself pass the arithmetic gate before
  // the invoice proceeds. Fully audited (actor, note, before/after data).
  async reconcileInvoice(
    user: IUserContext,
    documentUuid: string,
    corrections: {
      lines?: unknown[];
      taxTotal?: number;
      additionalCharges?: unknown[];
      statedPayableAmount?: number;
      note?: string;
    },
  ): Promise<DocumentResponseDto> {
    const document = await this.findVisibleDocument(user, documentUuid);
    if (document.status !== DocumentStatusEnum.INVOICE_MISMATCH) {
      throw new BadRequestException(
        `Document ${documentUuid} is not in the reconciliation queue (status ${document.status})`,
      );
    }

    const before = document.extractedData ?? {};
    const corrected: Record<string, unknown> = { ...before };
    for (const key of [
      'lines',
      'taxTotal',
      'additionalCharges',
      'statedPayableAmount',
    ] as const) {
      if (corrections[key] !== undefined) corrected[key] = corrections[key];
    }

    const mathResult = this.invoiceMathService.verify(corrected);
    if (!mathResult.passed) {
      throw new BadRequestException({
        message:
          'Corrected invoice still fails the arithmetic check — not reconciled',
        checks: mathResult.checks,
      });
    }

    await this.entityManager.transaction(async (manager) => {
      await manager.update(
        StoredDocument,
        { id: document.id },
        {
          status: DocumentStatusEnum.VALIDATED,
          extractedData: corrected,
          validationResult: mathResult as unknown as Record<string, unknown>,
        },
      );
      await this.documentEventRepository.record(
        {
          documentId: document.id,
          eventType: DocumentEventTypeEnum.INVOICE_RECONCILED,
          actorPersonId: user.id,
          beforeStatus: DocumentStatusEnum.INVOICE_MISMATCH,
          afterStatus: DocumentStatusEnum.VALIDATED,
          detail: {
            note: corrections.note ?? null,
            beforeData: before,
            afterData: corrected,
          },
        },
        manager,
      );

      const submissionEventId = randomUUID();
      const hydrated = new StoredDocument({
        ...document,
        extractedData: corrected,
      });
      await this.outboxEventRepository.record(manager, {
        id: submissionEventId,
        topic: KafkaTopicEnum.INVOICE_EXTRACTION_VALIDATED,
        payload: this.invoiceMathService.buildSubmission(
          hydrated,
          submissionEventId,
        ) as unknown as Record<string, unknown>,
      });
      await this.documentEventRepository.record(
        {
          documentId: document.id,
          eventType: DocumentEventTypeEnum.INVOICE_SUBMITTED,
          actorPersonId: user.id,
          detail: { submissionEventId },
        },
        manager,
      );
    });

    document.status = DocumentStatusEnum.VALIDATED;
    return DocumentResponseDto.fromEntity(document);
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
