import { Inject, Injectable } from '@nestjs/common';
import { IOCRService } from './ocr.interface';
import { ConfigService } from '@nestjs/config';
import {
  GetDocumentTextDetectionCommand,
  JobStatus,
  StartDocumentTextDetectionCommand,
  TextractClient,
  BlockType,
} from '@aws-sdk/client-textract';

@Injectable()
export class OCRService implements IOCRService {
  private documentExtractionBucket: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('TextractClient') private textractClient: TextractClient,
  ) {
    this.documentExtractionBucket = this.configService.getOrThrow(
      'DOCUMENT_EXTRACTION_BUCKET_NAME',
    );
  }

  async initiateOCR(filePath: string): Promise<string> {
    const { JobId } = await this.textractClient.send(
      new StartDocumentTextDetectionCommand({
        DocumentLocation: {
          S3Object: { Bucket: this.documentExtractionBucket, Name: filePath },
        },
      }),
    );

    if (!JobId) throw new Error('Failed to start Textract OCR job');

    return JobId;
  }

  async fetchOCR(jobId: string): Promise<{
    status: JobStatus;
    pages?: number;
    text?: string;
    error?: string;
  }> {
    const res = await this.textractClient.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId }),
    );

    switch (res.JobStatus) {
      case JobStatus.IN_PROGRESS:
        return { status: JobStatus.IN_PROGRESS };
      case JobStatus.PARTIAL_SUCCESS:
      case JobStatus.SUCCEEDED: {
        const lines = (res.Blocks ?? [])
          .filter((b) => b.BlockType === BlockType.LINE && b.Text)
          .map((b) => b.Text?.trim() ?? '');
        return {
          status: JobStatus.SUCCEEDED,
          text: lines.join('\n'),
          pages: res.DocumentMetadata.Pages,
        };
      }
      case JobStatus.FAILED:
        return {
          status: JobStatus.FAILED,
          error: res?.StatusMessage || 'Textract job failed',
        };
      default:
        return { status: JobStatus.IN_PROGRESS };
    }
  }
}
