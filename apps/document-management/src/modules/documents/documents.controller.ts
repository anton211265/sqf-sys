import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  OnModuleInit,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiExcludeController } from '@nestjs/swagger';
import { ClientKafka } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { KafkaJwtAuthGuard } from '@app/common/apps/common/guard/kafka-jwt.guard';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ErrorMessage } from '@app/common/apps/common/enum/error-messages.enum';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/request/upload-document.dto';
import { ListDocumentsDto } from './dto/request/list-documents.dto';
import {
  DocumentResponseDto,
  PresignedUrlResponseDto,
} from './dto/response/document-response.dto';

@ApiExcludeController()
@UseGuards(KafkaJwtAuthGuard)
@Controller('documents')
export class DocumentsController implements OnModuleInit {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(
    private readonly documentsService: DocumentsService,
    @Inject(TRADE_SERVICE) private readonly authClient: ClientKafka,
  ) {}

  async onModuleInit() {
    this.authClient.subscribeToResponseOf(KafkaTopicEnum.AUTHENTICATE);
  }

  @Throttle({ default: { ttl: 60000, limit: 100 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 100 * 1024 * 1024 },
    }),
  )
  @Post('upload')
  async upload(
    @CurrentUser() user: IUserContext,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<DocumentResponseDto> {
    if (!file) {
      throw new BadRequestException(ErrorMessage.MISSING_FILE);
    }
    return this.documentsService.upload(user, uploadDocumentDto, file);
  }

  @Get()
  async list(
    @CurrentUser() user: IUserContext,
    @Query() listDocumentsDto: ListDocumentsDto,
  ): Promise<DocumentResponseDto[]> {
    return this.documentsService.list(user, listDocumentsDto);
  }

  @Get(':documentUuid')
  async getByUuid(
    @CurrentUser() user: IUserContext,
    @Param('documentUuid', ParseUUIDPipe) documentUuid: string,
  ): Promise<DocumentResponseDto> {
    return this.documentsService.getByUuid(user, documentUuid);
  }

  @Get(':documentUuid/url')
  async getPresignedUrl(
    @CurrentUser() user: IUserContext,
    @Param('documentUuid', ParseUUIDPipe) documentUuid: string,
  ): Promise<PresignedUrlResponseDto> {
    return this.documentsService.getPresignedUrl(user, documentUuid);
  }
}
