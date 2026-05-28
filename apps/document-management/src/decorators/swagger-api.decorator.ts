import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorMessage } from '@app/common/apps/common/enum/error-messages.enum';
import { RequestIdResponseDto as ConsensusMessagingResponse } from '../modules/consensus-messaging/dto/response/request-id-response.dto';
import { CreateTopicDto } from '../modules/consensus-messaging/dto/request/create-topic.dto';
import { CreateMessageDto } from '../modules/consensus-messaging/dto/request/create-message.dto';
import { RequestIdResponseDto as ExtractionResponse } from '../modules/document-extraction/dto/response/request-id-response.dto';
import { ExtractionDto } from '../modules/document-extraction/dto/request/extraction.dto';
import { DocumentExtractinResponseDto } from '../modules/document-extraction/dto/response/document-extractions-response.dto';
import { OnchainResponseDto } from '../modules/consensus-messaging/dto/response/onchains-response.dto';

function CommonSwaggerApiDecorators() {
  return [
    ApiHeader({
      name: 'api-key',
      description: 'API key needed to access this endpoint',
      required: true,
    }),
    ApiUnauthorizedResponse({ description: ErrorMessage.INVALID_API_KEY }),
    ApiInternalServerErrorResponse({
      description: ErrorMessage.INTERNAL_SERVER_ERROR,
    }),
  ];
}

export function CreateTopicSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Create a Hedera Topic with Initial Message',
      description:
        'This endpoint creates a new topic on the Hedera Consensus Service and submits the initial message to it.',
    }),
    ApiBody({
      description:
        'Request payload for submitting a message to the Hedera Consensus Service. ' +
        'The `refId`, `eventName`, and `attributes` are all stored in the message on-chain. ' +
        '`refId` and `eventName` are client-defined values used to identify and track events when webhooks are triggered. ' +
        'The `attributes` array contains structured information such as `dataType` and `hash`, allowing the data to be verified and ensuring it hasn’t been changed.',
      type: CreateTopicDto,
    }),
    ApiCreatedResponse({ type: ConsensusMessagingResponse }),
  );
}

export function CreateMessageSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Submit a Message to an Existing Hedera Topic',
      description:
        'This endpoint adds a new message to an existing topic on the Hedera Consensus Service.',
    }),
    ApiBody({
      description:
        'Payload for appending a message to an existing Hedera topic. ' +
        'The `refId`, `eventName`, and `attributes` are all stored in the message on-chain. ' +
        '`refId` and `eventName` are client-defined values used to identify and track events when webhooks are triggered. ' +
        'The `attributes` array contains structured information such as `dataType` and `hash`, allowing the data to be verified and ensuring it hasn’t been changed.',
      type: CreateMessageDto,
    }),
    ApiParam({
      name: 'topicId',
      required: true,
      description:
        'The unique ID of the existing Hedera topic to which the message will be appended.',
      example: '0.0.123456',
    }),
    ApiCreatedResponse({ type: ConsensusMessagingResponse }),
  );
}

export function InitiateDocumentExtractionSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Upload a Document for Data Extraction',
      description:
        'This endpoint will extract data from the uploaded document based on the prompts from a template.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiExtraModels(ExtractionDto),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Upload a file in PDF, PNG, or JPEG format',
          },
        },
        required: ['file'],
        allOf: [{ $ref: getSchemaPath(ExtractionDto) }],
      },
    }),
    ApiCreatedResponse({ type: ExtractionResponse }),
    ApiBadRequestResponse({
      description: ErrorMessage.MISSING_FILE,
    }),
  );
}

export function GetDocumentExtractionsSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Fetch All Document Extraction',
      description: 'Returns a list of all document extractions.',
    }),
    ApiOkResponse({ type: DocumentExtractinResponseDto, isArray: true }),
  );
}

export function GetDocumentExtractionSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Fetch Document Extraction based on requestId',
      description: 'Returns a document extraction.',
    }),
    ApiOkResponse({ type: DocumentExtractinResponseDto, isArray: false }),
  );
}

export function GetOnchainsSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Fetch All Consensus Messages',
      description: 'Returns a list of all consensus messages.',
    }),
    ApiOkResponse({ type: OnchainResponseDto, isArray: true }),
  );
}

export function GetOnchainSwaggerApiDecorator() {
  return applyDecorators(
    ...CommonSwaggerApiDecorators(),
    ApiOperation({
      summary: 'Fetch Consensus Message based on requestId',
      description: 'Returns a consensus message.',
    }),
    ApiOkResponse({ type: OnchainResponseDto, isArray: false }),
  );
}
