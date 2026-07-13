import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  OnModuleInit,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  DOCUMENT_EXTRACTION_SERVICE,
  IDocumentExtractionService,
} from './document-extraction.interface';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { DocumentExtractionKafkaRequest } from '@app/common/apps/common/interface/document-extraction.interface';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../auth/guards/api-key-auth.guard';
import { IContext } from '../../middleware/contexts';
import { ExtractionDto } from './dto/request/extraction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  GetDocumentExtractionsSwaggerApiDecorator,
  GetDocumentExtractionSwaggerApiDecorator,
  InitiateDocumentExtractionSwaggerApiDecorator,
} from '../../decorators/swagger-api.decorator';
import { ErrorMessage } from '@app/common/apps/common/enum/error-messages.enum';
import { DocumentExtractions } from './dto/request/document-extractions.dto';
import { DocumentExtractinResponseDto } from './dto/response/document-extractions-response.dto';
import createTopics from 'libs/common/kafka/createTopics';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ConfigService } from '@nestjs/config';
import { KafkaJwtAuthGuard } from '@app/common/apps/common/guard/kafka-jwt.guard';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { GetTemplatesResponseDto } from './dto/response/get-templates-response.dto';
import { GetTemplateResponseDto } from './dto/response/get-template-response.dto';
import { CreateTemplateDto } from './dto/request/create-template.dto';
import { CreateTemplateResponseDto } from './dto/response/create-template-response.dto';
import { UpdateTemplateDto } from './dto/request/update-template.dto';
import { UpdateTemplateResponseDto } from './dto/response/update-template-response.dto';
import { DeleteTemplateResponseDto } from './dto/response/delete-template-response.dto';
import { GetDocumentsDto } from './dto/request/get-documents.dto';
import { Response } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('Extraction')
@Controller('extraction')
export class DocumentExtractionController implements OnModuleInit {
  private readonly logger = new Logger(DocumentExtractionController.name);

  constructor(
    @Inject(DOCUMENT_EXTRACTION_SERVICE)
    private readonly documentExtractionService: IDocumentExtractionService,
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  async onModuleInit() {
    createTopics(
      this.configService.getOrThrow('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Get('template')
  async getTemplates(
    @CurrentUser() user: IUserContext,
  ): Promise<GetTemplatesResponseDto[]> {
    return this.documentExtractionService.getTemplates(user.orgId);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Get('template/:id')
  async getTemplate(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
  ): Promise<GetTemplateResponseDto> {
    return this.documentExtractionService.getTemplate(user.orgId, id);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Post('template')
  async createTemplate(
    @CurrentUser() user: IUserContext,
    @Body() createTemplateDto: CreateTemplateDto,
  ): Promise<CreateTemplateResponseDto> {
    return this.documentExtractionService.createTemplate(
      user.orgId,
      createTemplateDto,
    );
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Post('template/:id')
  async updateTemplate(
    @CurrentUser() user: IUserContext,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Param('id') id: string,
  ): Promise<UpdateTemplateResponseDto> {
    return this.documentExtractionService.updateTemplate(
      user.orgId,
      updateTemplateDto,
      id,
    );
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Delete('template/:id')
  async deleteTemplate(
    @CurrentUser() user: IUserContext,
    @Param('id') id: string,
  ): Promise<DeleteTemplateResponseDto> {
    return this.documentExtractionService.deleteTemplate(user.orgId, id);
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Get('document')
  async getMessages(
    @CurrentUser() user: IUserContext,
    @Query() getDocumentsDto: GetDocumentsDto,
  ): Promise<DocumentExtractinResponseDto[]> {
    return this.documentExtractionService.documentExtractions(
      user.orgId.toString(),
      getDocumentsDto?.status,
    );
  }

  @SkipThrottle()
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @Post('document/:requestId')
  async downloadDocument(
    @CurrentUser() user: IUserContext,
    @Param('requestId') requestId: string,
    @Res() res: Response,
  ) {
    const fileStream = await this.documentExtractionService.getFileStream(
      user.orgId,
      requestId,
    );

    fileStream.pipe(res);
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @ApiExcludeEndpoint()
  @UseGuards(KafkaJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 100 * 1024 * 1024 },
    }),
  )
  @Post('upload')
  async dashboardInitiateDocumentExtraction(
    @CurrentUser() user: IUserContext,
    @Body() extractionDto: ExtractionDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<RequestIdResponseDto> {
    if (!file) {
      throw new BadRequestException(ErrorMessage.MISSING_FILE);
    }

    const orgId = user.orgId.toString();
    const { templateId, refId, documentType } = extractionDto;
    const { originalname, buffer, mimetype } = file;

    return this.documentExtractionService.initiateDocumentExtraction(
      originalname,
      buffer,
      templateId,
      documentType,
      refId,
      orgId,
      false,
      mimetype,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @InitiateDocumentExtractionSwaggerApiDecorator()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 100 * 1024 * 1024 },
    }),
  )
  @Post()
  @UseGuards(ApiKeyAuthGuard)
  async initiateDocumentExtraction(
    @Req() req: IContext,
    @Body() extractionDto: ExtractionDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<RequestIdResponseDto> {
    if (!file) {
      throw new BadRequestException(ErrorMessage.MISSING_FILE);
    }

    const orgId = req.user.orgId;
    const { templateId, refId, documentType } = extractionDto;
    const { originalname, buffer, mimetype } = file;

    return this.documentExtractionService.initiateDocumentExtraction(
      originalname,
      buffer,
      templateId,
      documentType,
      refId,
      orgId,
      false,
      mimetype,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @GetDocumentExtractionsSwaggerApiDecorator()
  @Get()
  @UseGuards(ApiKeyAuthGuard)
  async documentExtractions(
    @Req() req: IContext,
    @Query() documentExtractionsDto: DocumentExtractions,
  ): Promise<DocumentExtractinResponseDto[]> {
    const orgId = req.user.orgId;

    return this.documentExtractionService.documentExtractions(
      orgId,
      documentExtractionsDto?.status,
    );
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @GetDocumentExtractionSwaggerApiDecorator()
  @Get(':requestId')
  @UseGuards(ApiKeyAuthGuard)
  async documentExtraction(
    @Req() req: IContext,
    @Param('requestId') requestId: string,
  ): Promise<DocumentExtractinResponseDto> {
    const orgId = req.user.orgId;

    return this.documentExtractionService.documentExtraction(orgId, requestId);
  }

  @Throttle({
    default: {
      ttl: 60000,
      limit: 100,
    },
  })
  @ApiExcludeEndpoint()
  @Post(':requestId/approve')
  @UseGuards(ApiKeyAuthGuard)
  async approveReviewedExtraction(
    @Req() req: IContext,
    @Param('requestId') requestId: string,
  ): Promise<RequestIdResponseDto> {
    const orgId = req.user.orgId;

    return this.documentExtractionService.approveReviewedExtraction(
      orgId,
      requestId,
    );
  }

  @EventPattern(KafkaTopicEnum.SQF_DOCUMENT_EXTRACTION)
  async initiateDocumentExtractionKafka(
    @Payload() documentExtractionPayload: DocumentExtractionKafkaRequest,
  ): Promise<RequestIdResponseDto> {
    if (
      await this.processedEventRepository.exists(
        documentExtractionPayload.eventId,
      )
    ) {
      this.logger.warn(
        `Skipping already-processed SQF_DOCUMENT_EXTRACTION event: ${documentExtractionPayload.eventId}`,
      );
      return;
    }

    const { file, fileName, templateId, documentType, refId, orgId, mimetype } =
      documentExtractionPayload;
    const isInternal = true;

    const result = await this.documentExtractionService.initiateDocumentExtraction(
      fileName,
      file,
      templateId,
      documentType,
      refId,
      orgId,
      isInternal,
      mimetype,
    );

    await this.entityManager.transaction(async (manager) => {
      await this.processedEventRepository.record(manager, {
        id: documentExtractionPayload.eventId,
        topic: KafkaTopicEnum.SQF_DOCUMENT_EXTRACTION,
      });
    });

    return result;
  }
}
