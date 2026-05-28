import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IDocumentExtractionService } from './document-extraction.interface';
import { DocumentExtractionRepository } from '../../repositories/document-extraction.repository';
import {
  DocumentExtraction,
  DocumentExtractionInternalType,
  DocumentExtractionStatus,
} from '../../models/document-extraction.entity';
import { PromptTemplateRepository } from '../../repositories/prompt-template.repository';
import { v4 as uuidv4 } from 'uuid';
import { PromptTemplate } from '../../models/prompt-template.entity';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';
import { DocumentExtractinResponseDto } from './dto/response/document-extractions-response.dto';
import { DocumentExtractionsQueryType } from '../../interface/query.interface';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { IOCRService, OCR_SERVICE } from '../ocr/ocr.interface';
import { GetTemplatesResponseDto } from './dto/response/get-templates-response.dto';
import { GetTemplateResponseDto } from './dto/response/get-template-response.dto';
import { CreateTemplateDto } from './dto/request/create-template.dto';
import { CreateTemplateResponseDto } from './dto/response/create-template-response.dto';
import { UpdateTemplateDto } from './dto/request/update-template.dto';
import { UpdateTemplateResponseDto } from './dto/response/update-template-response.dto';
import { DeleteTemplateResponseDto } from './dto/response/delete-template-response.dto';
import { Readable } from 'stream';
import { ErrorMessage } from '@app/common/apps/common/enum/error-messages.enum';

@Injectable()
export class DocumentExtractionService implements IDocumentExtractionService {
  private documentExtractionBucket: string;

  constructor(
    private readonly documentExtractionRepository: DocumentExtractionRepository,
    private readonly promptTemplateRepository: PromptTemplateRepository,
    @Inject('S3Client') private s3Client: S3Client,
    private readonly configService: ConfigService,
    @Inject(OCR_SERVICE) private readonly ocrService: IOCRService,
  ) {
    this.documentExtractionBucket = this.configService.getOrThrow(
      'DOCUMENT_EXTRACTION_BUCKET_NAME',
    );
  }

  async initiateDocumentExtraction(
    fileName: string,
    file: Buffer,
    templateId: string,
    documentType: string,
    refId: string,
    orgId: string,
    isInternal: boolean,
    mime: string,
  ): Promise<RequestIdResponseDto> {
    const supportedDocExtractionType: string[] = [
      'application/pdf',
      'image/png',
      'image/jpeg',
    ];

    if (!supportedDocExtractionType.includes(mime)) {
      throw new BadRequestException(
        `Unsupported file type: ${mime ?? 'unknown'}`,
      );
    }

    await this.checkExistingTemplate(templateId, orgId, isInternal);

    const requestId = uuidv4();

    const filePath = `${orgId}/${requestId}_${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.documentExtractionBucket,
        Key: filePath,
        Body: file,
      }),
    );

    const jobId = await this.ocrService.initiateOCR(filePath);

    const newDocumentExtraction = new DocumentExtraction({
      requestId,
      fileName,
      templateId,
      status: DocumentExtractionStatus.PENDING_OCR,
      documentType,
      refId,
      orgId,
      isInternal,
      filePath,
      jobId,
    });

    await this.documentExtractionRepository.save(newDocumentExtraction);

    return { requestId };
  }

  async handleInternalExtractionCompletion(
    data: DocumentExtraction,
  ): Promise<void> {
    const { documentType } = data;

    switch (documentType) {
      case DocumentExtractionInternalType.TEST:
        // Handle the extracted data processing based on type of document/text

        break;
      default:
        throw new UnprocessableEntityException(
          `Unhandled internal extraction document type: ${documentType}`,
        );
    }
  }

  async documentExtractions(
    orgId: string,
    status?: DocumentExtractionStatus,
  ): Promise<DocumentExtractinResponseDto[]> {
    const query: DocumentExtractionsQueryType = {};

    if (status) {
      query.status = status;
    }

    const documentExtractions = await this.documentExtractionRepository.find({
      where: { orgId, ...query },
      select: [
        'requestId',
        'refId',
        'status',
        'templateId',
        'documentType',
        'fileName',
        'extractedData',
        'error',
        'createdAt',
        'pages',
        'tokens',
        'llmProvider',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    const response: DocumentExtractinResponseDto[] = documentExtractions.map(
      (r) => ({
        requestId: r.requestId,
        refId: r.refId,
        status: r.status,
        templateId: r.templateId,
        documentType: r.documentType,
        fileName: r.fileName ?? null,
        extractedData: r.extractedData ?? null,
        error: r.error ?? null,
        createdAt: r.createdAt,
        llmProvider: r.llmProvider ?? null,
        tokens: r.tokens ?? null,
        pages: r.pages ?? null,
      }),
    );

    return response;
  }

  async documentExtraction(
    orgId: string,
    requestId: string,
  ): Promise<DocumentExtractinResponseDto> {
    const documentExtraction = await this.documentExtractionRepository.findOne({
      where: { requestId, orgId },
      select: [
        'requestId',
        'refId',
        'status',
        'templateId',
        'documentType',
        'fileName',
        'extractedData',
        'error',
        'createdAt',
        'pages',
        'tokens',
        'llmProvider',
      ],
    });

    if (!documentExtraction) {
      throw new BadRequestException(
        `No document extraction found with the following requestId: ${requestId}`,
      );
    }

    const response: DocumentExtractinResponseDto = {
      requestId: documentExtraction.requestId,
      refId: documentExtraction.refId,
      status: documentExtraction.status,
      templateId: documentExtraction.templateId,
      documentType: documentExtraction.documentType,
      fileName: documentExtraction.fileName ?? null,
      extractedData: documentExtraction.extractedData ?? null,
      error: documentExtraction.error ?? null,
      createdAt: documentExtraction.createdAt,
      llmProvider: documentExtraction.llmProvider ?? null,
      tokens: documentExtraction.tokens ?? null,
      pages: documentExtraction.pages ?? null,
    };

    return response;
  }

  private async checkExistingTemplate(
    templateId: string,
    orgId: string,
    isInternal: boolean,
  ): Promise<void> {
    let promptTemplate: PromptTemplate;

    if (isInternal) {
      promptTemplate = await this.promptTemplateRepository.findOne({
        where: { templateId: templateId },
      });
    } else {
      promptTemplate = await this.promptTemplateRepository.findOne({
        where: { templateId: templateId, orgId },
      });
    }

    if (!promptTemplate) {
      throw new BadRequestException(
        `No template found with the following id: ${templateId}`,
      );
    }

    return;
  }

  async getTemplates(orgId: number): Promise<GetTemplatesResponseDto[]> {
    const templates = await this.promptTemplateRepository.find({
      where: { orgId: orgId.toString() },
      order: { createdAt: 'DESC' },
    });

    const resposne: GetTemplatesResponseDto[] = [];

    for (const template of templates) {
      const { templateId, llmProvider, prompt, createdAt, name } = template;

      const numberOfPrompts = prompt.length;
      const entry: GetTemplatesResponseDto = {
        name,
        templateId,
        llmProvider,
        numberOfPrompts,
        createdAt,
        prompt,
      };

      resposne.push(entry);
    }

    return resposne;
  }

  async getTemplate(
    orgId: number,
    templateId: string,
  ): Promise<GetTemplateResponseDto> {
    const template = await this.promptTemplateRepository.findOne({
      where: { orgId: orgId.toString(), templateId },
    });

    if (!template) {
      throw new BadRequestException(
        `No template found with templateId: ${templateId}`,
      );
    }

    const { llmProvider, prompt, name } = template;

    const response: GetTemplateResponseDto = {
      name,
      templateId,
      llmProvider,
      prompt,
    };

    return response;
  }

  async createTemplate(
    orgId: number,
    data: CreateTemplateDto,
  ): Promise<CreateTemplateResponseDto> {
    const templateId = uuidv4();
    const { name, prompt, llmProvider } = data;

    const newTemplate = new PromptTemplate({
      templateId,
      orgId: orgId.toString(),
      name,
      prompt,
      llmProvider,
    });

    await this.promptTemplateRepository.save(newTemplate);

    return { message: 'success' };
  }

  async updateTemplate(
    orgId: number,
    data: UpdateTemplateDto,
    templateId: string,
  ): Promise<UpdateTemplateResponseDto> {
    const { name, prompt, llmProvider } = data;
    const template = await this.promptTemplateRepository.findOne({
      where: { orgId: orgId.toString(), templateId },
    });

    if (!template) {
      throw new BadRequestException(
        `Template with templateId: ${templateId} does not exist`,
      );
    }

    template.name = name;
    (template.prompt = prompt), (template.llmProvider = llmProvider);

    await this.promptTemplateRepository.save(template);

    return { message: 'success' };
  }

  async deleteTemplate(
    orgId: number,
    id: string,
  ): Promise<DeleteTemplateResponseDto> {
    await this.promptTemplateRepository.delete({
      orgId: orgId.toString(),
      templateId: id,
    });

    return { message: 'success' };
  }

  async getFileStream(orgId: number, id: string): Promise<Readable> {
    const documentExtraction = await this.documentExtractionRepository.findOne({
      where: { orgId: orgId.toString(), requestId: id },
    });

    if (!documentExtraction) {
      throw new BadRequestException(
        `No document extraction found with requestId: ${id}`,
      );
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.documentExtractionBucket,
        Key: documentExtraction.filePath,
      });

      const response = await this.s3Client.send(command);

      return response.Body as Readable;
    } catch (error) {
      throw new BadRequestException(ErrorMessage.FILE_NOT_FOUND);
    }
  }
}
