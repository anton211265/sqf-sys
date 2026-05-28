import { OrganizationProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import { Organization } from '@app/common/apps/trade-directory/proto/entity';
import {
  CreateOrganizationDto,
  GetAllOrganizationDto,
  OrganizationByClientPersonaIdDto,
  OrganizationByContractAwarderPersonaIdDto,
  OrganizationByFactorPersonaIdDto,
  OrganizationByIdDto,
  OrganizationByNameDto,
  OrganizationBySupplierPersonaIdDto,
  OrganizationGrpcServiceController,
  OrganizationGrpcServiceControllerMethods,
  OrganizationList,
  UpdateOrganizationDto,
} from '@app/common/apps/trade-directory/proto/organization';
import {
  CreateOrganizationMessage,
  CreateOrganizationMessageReply,
  UpdateOrganizationByClientPersonaIdMessage,
  UpdateOrganizationByContractAwarderPersonaIdMessage,
  UpdateOrganizationByFactorPersonaIdMessage,
  UpdateOrganizationBySupplierPersonaIdMessage,
  UpdateOrganizationMessage,
  UpdateOrganizationMessageReply,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetOrganizationParamDto,
  GetOrganizationQueryDto,
} from './dtos/get-organization.dto';
import { GetOrganizationsQueryDto } from './dtos/get-organizations.dto';
import { OrganizationService } from './organization.service';
import { ConfigService } from '@nestjs/config';
import createTopics from 'libs/common/kafka/createTopics';
import { TRADE_SERVICE } from '@app/common/constants/services';

@Controller('organization')
@OrganizationGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class OrganizationController
  implements OrganizationGrpcServiceController
{
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly configService: ConfigService,
    @Inject(TRADE_SERVICE) private readonly kafkaProducer: ClientKafka,
  ) {}

  onModuleInit() {
    createTopics(
      this.configService.get('KAFKA_BROKERS').split(','),
      this.configService.getOrThrow('KAFKA_BROKER_SSL') === 'true',
    );

    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.CREATE_ORGANIZATION,
    );
    this.kafkaProducer.subscribeToResponseOf(
      KafkaTopicEnum.UPDATE_ORGANIZATION,
    );
  }

  async getAllGrpc(request: GetAllOrganizationDto): Promise<OrganizationList> {
    const data = await this.organizationService.getAll({
      includeClientPersona: request.includeClientPersona,
      includeContractAwarderPersona: request.includeContractAwarderPersona,
      includeSupplierPersona: request.includeSupplierPersona,
      includeBankAccount: request.includeBankAccount,
      includeOrganizationPerson: request.includeOrganizationPerson,
    });

    // this is a test commit message

    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findByIdGrpc(request: OrganizationByIdDto): Promise<OrganizationList> {
    const data = await this.organizationService.findById(request.id, {
      includeOrganizationPerson: request.includeOrganizationPerson,
      includeBankAccount: request.includeBankAccount,
      includeClientPersona: request.includeClientPersona,
      includeContractAwarderPersona: request.includeContractAwarderPersona,
      includeSupplierPersona: request.includeSupplierPersona,
    });
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findByClientPersonaIdGrpc(
    request: OrganizationByClientPersonaIdDto,
  ): Promise<OrganizationList> {
    const data = await this.organizationService.findByClientPersonaId(
      request.clientPersonaId,
      {
        includeOrganizationPerson: request.includeOrganizationPerson,
        includeBankAccount: request.includeBankAccount,
        includeContractAwarderPersona: request.includeContractAwarderPersona,
        includeSupplierPersona: request.includeSupplierPersona,
      },
    );
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findByContractAwarderPersonaIdGrpc(
    request: OrganizationByContractAwarderPersonaIdDto,
  ): Promise<OrganizationList> {
    const data = await this.organizationService.findByContractAwarderPersonaId(
      request.contractAwarderPersonaId,
      {
        includeOrganizationPerson: request.includeOrganizationPerson,
        includeBankAccount: request.includeBankAccount,
        includeClientPersona: request.includeClientPersona,
        includeSupplierPersona: request.includeSupplierPersona,
      },
    );
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findBySupplierPersonaIdGrpc(
    request: OrganizationBySupplierPersonaIdDto,
  ): Promise<OrganizationList> {
    const data = await this.organizationService.findBySupplierPersonaId(
      request.supplierPersonaId,
      {
        includeOrganizationPerson: request.includeOrganizationPerson,
        includeBankAccount: request.includeBankAccount,
        includeClientPersona: request.includeClientPersona,
        includeContractAwarderPersona: request.includeContractAwarderPersona,
      },
    );
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findByFactorPersonaIdGrpc(
    request: OrganizationByFactorPersonaIdDto,
  ): Promise<OrganizationList> {
    const data = await this.organizationService.findByFactorPersonaId(
      request.factorPersonaId,
      {
        includeOrganizationPerson: request.includeOrganizationPerson,
        includeBankAccount: request.includeBankAccount,
        includeClientPersona: request.includeClientPersona,
        includeContractAwarderPersona: request.includeContractAwarderPersona,
        includeSupplierPersona: request.includeSupplierPersona,
      },
    );
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async findByNameGrpc(
    request: OrganizationByNameDto,
  ): Promise<OrganizationList> {
    const data = await this.organizationService.findByName(request.name, {
      includeOrganizationPerson: request.includeOrganizationPerson,
      includeBankAccount: request.includeBankAccount,
      includeClientPersona: request.includeClientPersona,
      includeContractAwarderPersona: request.includeContractAwarderPersona,
      includeSupplierPersona: request.includeSupplierPersona,
    });
    const response: OrganizationList = {
      organizations: data.map((organization) =>
        OrganizationProtoConverter.convertToProto(organization),
      ),
    };
    return response;
  }

  async createGrpc(request: CreateOrganizationDto): Promise<Organization> {
    const data = await this.organizationService.createOrganization(
      OrganizationProtoConverter.convertToUpdatableApp(request.organization),
    );
    return OrganizationProtoConverter.convertToProto(data);
  }

  async updateGrpc(request: UpdateOrganizationDto): Promise<Organization> {
    const data = await this.organizationService.updateOrganization(
      request.id,
      OrganizationProtoConverter.convertToUpdatableApp(request.organization),
    );
    return OrganizationProtoConverter.convertToProto(data);
  }

  @MessagePattern(KafkaTopicEnum.CREATE_ORGANIZATION)
  async createOrganizationEvent(
    request: CreateOrganizationMessage,
  ): Promise<CreateOrganizationMessageReply> {
    return await this.organizationService.createOrganizationEvent(request);
  }

  @MessagePattern(KafkaTopicEnum.UPDATE_ORGANIZATION)
  async updateOrganizationEvent(
    request:
      | UpdateOrganizationMessage
      | UpdateOrganizationByClientPersonaIdMessage
      | UpdateOrganizationByContractAwarderPersonaIdMessage
      | UpdateOrganizationBySupplierPersonaIdMessage
      | UpdateOrganizationByFactorPersonaIdMessage,
  ): Promise<UpdateOrganizationMessageReply> {
    return await this.organizationService.updateOrganizationEvent(request);
  }

  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'pageNumber',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'includeFactorPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeSupplierPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeContractAwarderPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeBankAccount',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeOrganizationPersonRole',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includePerson',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeOrganizationPerson',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'organizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @Get()
  async getOrganizations(
    @Query()
    query: GetOrganizationsQueryDto,
  ) {
    return await this.organizationService.getOrganizations({
      organizationName: query.organizationName,
      pageSize: query.pageSize,
      pageNumber: query.pageNumber,
      includeOrganizationPerson: {
        value: query.includeOrganizationPerson,
        includePerson: {
          value: query.includePerson,
        },
        includeOrganizationPersonRole: {
          value: query.includeOrganizationPersonRole,
        },
      },
      includeBankAccount: {
        value: query.includeBankAccount,
      },
      includeClientPersona: {
        value: query.includeClientPersona,
      },
      includeContractAwarderPersona: {
        value: query.includeContractAwarderPersona,
      },
      includeSupplierPersona: {
        value: query.includeSupplierPersona,
      },
      includeFactorPersona: {
        value: query.includeFactorPersona,
      },
    });
  }

  @ApiQuery({
    name: 'includeFactorPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeSupplierPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeContractAwarderPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeClientPersona',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeBankAccount',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeOrganizationPersonRole',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includePerson',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'includeOrganizationPerson',
    required: false,
    type: Boolean,
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Get('/:id')
  async getOrganization(
    @Param()
    param: GetOrganizationParamDto,
    @Query()
    query: GetOrganizationQueryDto,
  ) {
    return await this.organizationService.getOrganization(param.id, {
      includeOrganizationPerson: {
        value: query.includeOrganizationPerson,
        includePerson: {
          value: query.includePerson,
        },
        includeOrganizationPersonRole: {
          value: query.includeOrganizationPersonRole,
        },
      },
      includeBankAccount: {
        value: query.includeBankAccount,
      },
      includeClientPersona: {
        value: query.includeClientPersona,
      },
      includeContractAwarderPersona: {
        value: query.includeContractAwarderPersona,
      },
      includeSupplierPersona: {
        value: query.includeSupplierPersona,
      },
      includeFactorPersona: {
        value: query.includeFactorPersona,
      },
    });
  }
}
