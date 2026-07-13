import { Readable } from 'stream';
import {
  DocumentExtraction,
  DocumentExtractionInternalType,
  DocumentExtractionStatus,
} from '../../models/document-extraction.entity';
import { CreateTemplateDto } from './dto/request/create-template.dto';
import { UpdateTemplateDto } from './dto/request/update-template.dto';
import { CreateTemplateResponseDto } from './dto/response/create-template-response.dto';
import { DeleteTemplateResponseDto } from './dto/response/delete-template-response.dto';
import { DocumentExtractinResponseDto } from './dto/response/document-extractions-response.dto';
import { GetTemplateResponseDto } from './dto/response/get-template-response.dto';
import { GetTemplatesResponseDto } from './dto/response/get-templates-response.dto';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';
import { UpdateTemplateResponseDto } from './dto/response/update-template-response.dto';

export const DOCUMENT_EXTRACTION_SERVICE = 'DOCUMENT EXTRACTION SERVICE';

export interface IDocumentExtractionService {
  /**
   * Initiates document extraction (OCR and LLM extraction).
   * @param fileName - Name of the document.
   * @param file - The document buffer.
   * @param templateId - The ID of the template guiding the extraction.
   * @param documentType - The type of doc for example purchaseOrder.
   * @param refId - The reference id
   * @param orgId - the organization id
   * @param isInternal - True if used by sqf
   * @param mime - The mine of the file
   */
  initiateDocumentExtraction(
    fileName: string,
    file: Buffer,
    templateId: string,
    documentType: string | DocumentExtractionInternalType,
    refId: string,
    orgId: string,
    isInternal: boolean,
    mime: string,
  ): Promise<RequestIdResponseDto>;

  /**
   * Handle internal extration completion (if not internal then webhook will be sent)
   * @param data - DocumentExtraction entity
   */
  handleInternalExtractionCompletion(data: DocumentExtraction): Promise<void>;

  /**
   * Approve a vision-LLM transcription that's pending human review, advancing it
   * to LLM field extraction. Throws if the extraction isn't in PENDING_REVIEW.
   * @param orgId - the organization id
   * @param requestId - the requestId
   */
  approveReviewedExtraction(
    orgId: string,
    requestId: string,
  ): Promise<RequestIdResponseDto>;

  /**
   * Fetch all document extractions
   * @param orgId - The organization id
   * @param status - The status of document extraction
   */
  documentExtractions(
    orgId: string,
    status?: DocumentExtractionStatus,
  ): Promise<DocumentExtractinResponseDto[]>;

  /**
   * Fetch a document extraction based on requestId
   * @param orgId - The organization id
   * @param requestId - The requestId
   */
  documentExtraction(
    orgId: string,
    requestId: string,
  ): Promise<DocumentExtractinResponseDto>;

  /**
   * Fetch all templates
   * @param orgId
   */
  getTemplates(orgId: number): Promise<GetTemplatesResponseDto[]>;

  /**
   * Fetch a template based on templateId
   * @param orgId
   * @param templateId
   */
  getTemplate(
    orgId: number,
    templateId: string,
  ): Promise<GetTemplateResponseDto>;

  /**
   * Create a template
   * @param orgId
   * @param data
   */
  createTemplate(
    orgId: number,
    data: CreateTemplateDto,
  ): Promise<CreateTemplateResponseDto>;

  /**
   * Update a template
   * @param orgId
   * @param data
   * @param templateId
   */
  updateTemplate(
    orgId: number,
    data: UpdateTemplateDto,
    templateId: string,
  ): Promise<UpdateTemplateResponseDto>;

  /**
   * Delete a template
   * @param orgId
   * @param id
   */
  deleteTemplate(orgId: number, id: string): Promise<DeleteTemplateResponseDto>;

  /**
   * Fetch file from s3
   * @param orgId
   * @param id
   */
  getFileStream(orgId: number, id: string): Promise<Readable>;
}
