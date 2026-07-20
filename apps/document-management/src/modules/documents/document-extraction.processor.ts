import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, Not } from 'typeorm';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import {
  DocumentEventTypeEnum,
  DocumentStatusEnum,
  ExtractionMethodEnum,
} from '@app/common/apps/document-management/enums/document-status.enum';
import { StoredDocument } from '../../models/document.entity';
import { DocumentRepository } from '../../repositories/document.repository';
import { DocumentEventRepository } from '../../repositories/document-event.repository';
import {
  IMarkitdownService,
  MARKITDOWN_SERVICE,
} from '../markitdown/markitdown.interface';
import {
  IVisionExtractionService,
  VISION_EXTRACTION_SERVICE,
} from '../vision-extraction/vision-extraction.interface';
import { ClaudeExtractionService } from './claude-extraction.service';

const MIN_VIABLE_TEXT_LENGTH = 20;
const BATCH_SIZE = 5;

// Vision fallback is allowed only for invoices — onboarding classes already
// rejected image-only files at upload.
const VISION_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
]);

@Injectable()
export class DocumentExtractionProcessor {
  private readonly logger = new Logger(DocumentExtractionProcessor.name);
  private isRunning = false;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly documentEventRepository: DocumentEventRepository,
    private readonly claudeExtractionService: ClaudeExtractionService,
    @Inject('S3Client') private readonly s3Client: S3Client,
    @Inject(MARKITDOWN_SERVICE)
    private readonly markitdownService: IMarkitdownService,
    @Inject(VISION_EXTRACTION_SERVICE)
    private readonly visionExtractionService: IVisionExtractionService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handlePendingExtractions(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const candidates = await this.documentRepository.find({
        where: {
          status: DocumentStatusEnum.UPLOADED,
          documentClass: Not(DocumentClassEnum.OTHER),
        },
        order: { createdAt: 'ASC' },
        take: BATCH_SIZE,
      });

      for (const candidate of candidates) {
        // Optimistic claim — only proceed if we won the UPLOADED→EXTRACTING
        // transition (guards against a second instance).
        const claim = await this.documentRepository.update(
          { id: candidate.id, status: DocumentStatusEnum.UPLOADED },
          { status: DocumentStatusEnum.EXTRACTING },
        );
        if (!claim.affected) continue;

        await this.documentEventRepository.record({
          documentId: candidate.id,
          eventType: DocumentEventTypeEnum.EXTRACTION_STARTED,
          beforeStatus: DocumentStatusEnum.UPLOADED,
          afterStatus: DocumentStatusEnum.EXTRACTING,
        });

        try {
          await this.extract(candidate);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Extraction failed for document ${candidate.documentUuid}: ${message}`,
          );
          await this.entityManager.transaction(async (manager) => {
            await manager.update(
              StoredDocument,
              { id: candidate.id },
              {
                status: DocumentStatusEnum.EXTRACTION_FAILED,
                extractionError: message,
              },
            );
            await this.documentEventRepository.record(
              {
                documentId: candidate.id,
                eventType: DocumentEventTypeEnum.EXTRACTION_FAILED,
                beforeStatus: DocumentStatusEnum.EXTRACTING,
                afterStatus: DocumentStatusEnum.EXTRACTION_FAILED,
                detail: { error: message },
              },
              manager,
            );
          });
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async extract(document: StoredDocument): Promise<void> {
    let rawText = document.rawText;
    let extractionMethod = ExtractionMethodEnum.MARKITDOWN;

    if (!rawText || rawText.trim().length < MIN_VIABLE_TEXT_LENGTH) {
      const fileBuffer = await this.fetchFromS3(document);
      // CSV is already plain text — markitdown's CSV table inference is
      // lossy (a comma-less title row collapses it to one column), so pass
      // it through untouched.
      rawText =
        document.mimeType === 'text/csv'
          ? fileBuffer.toString('utf8')
          : await this.markitdownService.convertToMarkdown(
              fileBuffer,
              document.fileName,
            );

      if (rawText.trim().length < MIN_VIABLE_TEXT_LENGTH) {
        // No text layer. Invoices fall back to vision transcription; the
        // happy path is gated by the Phase 5 arithmetic check, not human
        // review (design decision 2026-07-19).
        if (
          document.documentClass === DocumentClassEnum.INVOICE &&
          VISION_MIMETYPES.has(document.mimeType)
        ) {
          rawText = await this.visionExtractionService.transcribeToMarkdown(
            fileBuffer,
            document.mimeType,
          );
          extractionMethod = ExtractionMethodEnum.VISION_LLM;
          if (rawText.trim().length < MIN_VIABLE_TEXT_LENGTH) {
            throw new Error(
              'Vision transcription produced no usable text for this invoice',
            );
          }
        } else {
          throw new Error(
            `Document has no extractable text layer (class ${document.documentClass}, ${document.mimeType})`,
          );
        }
      }
    }

    const extractedData = await this.claudeExtractionService.extractFields(
      rawText,
      document.documentClass,
    );

    await this.entityManager.transaction(async (manager) => {
      await manager.update(
        StoredDocument,
        { id: document.id },
        {
          status: DocumentStatusEnum.EXTRACTED,
          rawText,
          extractedData,
          extractionMethod,
          extractionError: null,
          extractedAt: new Date(),
        },
      );
      await this.documentEventRepository.record(
        {
          documentId: document.id,
          eventType: DocumentEventTypeEnum.EXTRACTION_COMPLETED,
          beforeStatus: DocumentStatusEnum.EXTRACTING,
          afterStatus: DocumentStatusEnum.EXTRACTED,
          detail: {
            extractionMethod,
            fieldCount: Object.keys(extractedData).length,
          },
        },
        manager,
      );
    });

    this.logger.log(
      `Extracted ${document.documentClass} document ${document.documentUuid} via ${extractionMethod}`,
    );
  }

  private async fetchFromS3(document: StoredDocument): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: document.bucketName,
        Key: document.objectKey,
      }),
    );
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
