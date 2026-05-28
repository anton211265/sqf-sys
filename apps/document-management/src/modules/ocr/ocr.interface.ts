export const OCR_SERVICE = 'OCR_SERVICE';
import { JobStatus } from '@aws-sdk/client-textract';

export interface IOCRService {
  /**
   * Start Textract job on the file
   * @param filePath - The S3 path to your file
   * @returns the Textract jobId
   */
  initiateOCR(filePath: string): Promise<string>;

  /**
   * Poll Textract for job status; assemble text when done.
   * @param jobId - The jobId
   * @returns status + text if successful
   */
  fetchOCR(ocrJobId: string): Promise<{
    status: JobStatus;
    pages?: number;
    text?: string;
    error?: string;
  }>;
}
