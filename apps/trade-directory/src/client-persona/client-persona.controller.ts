import { ClientPersonaProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  ClientPersonaByIdDto,
  ClientPersonaGrpcServiceController,
  ClientPersonaGrpcServiceControllerMethods,
  ClientPersonaList,
  CreateClientPersonaDto,
  GetAllClientPersonaDto,
  UpdateClientPersonaDto,
} from '@app/common/apps/trade-directory/proto/client-persona';
import { ClientPersona } from '@app/common/apps/trade-directory/proto/entity';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ClientPersonaService } from './client-persona.service';
import {
  GetClientPersonaByIdParamDto,
  GetClientPersonaByIdQueryDto,
} from './dtos/get-client-persona-by-id.dto';
import { GetClientPersonasQueryDto } from './dtos/get-client-personas.dto';

@Controller('client-persona')
@ClientPersonaGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class ClientPersonaController
  implements ClientPersonaGrpcServiceController
{
  constructor(private readonly clientPersonaService: ClientPersonaService) {}

  async getAllGrpc(
    request: GetAllClientPersonaDto,
  ): Promise<ClientPersonaList> {
    const data = await this.clientPersonaService.getAll({
      includeOrganization: request.includeOrganization,
    });
    const response: ClientPersonaList = {
      clientPersonas: data.map((clientPersona) =>
        ClientPersonaProtoConverter.convertToProto(clientPersona),
      ),
    };
    return response;
  }

  async findByIdGrpc(
    request: ClientPersonaByIdDto,
  ): Promise<ClientPersonaList> {
    const data = await this.clientPersonaService.findById(request.id, {
      includeOrganization: request.includeOrganization,
    });
    const response: ClientPersonaList = {
      clientPersonas: data.map((clientPersona) =>
        ClientPersonaProtoConverter.convertToProto(clientPersona),
      ),
    };
    return response;
  }

  async createGrpc(request: CreateClientPersonaDto): Promise<ClientPersona> {
    const data = await this.clientPersonaService.createClientPersona(
      request.organizationId,
      ClientPersonaProtoConverter.convertToUpdatableApp(request.clientPersona),
    );
    const response = ClientPersonaProtoConverter.convertToProto(data);
    return response;
  }

  async updateGrpc(request: UpdateClientPersonaDto): Promise<ClientPersona> {
    const data = await this.clientPersonaService.updateClientPersona(
      request.id,
      ClientPersonaProtoConverter.convertToUpdatableApp(request.clientPersona),
    );
    const response = ClientPersonaProtoConverter.convertToProto(data);
    return response;
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
    name: 'organizationName',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @Get()
  async getClientPersonas(
    @Query()
    query: GetClientPersonasQueryDto,
  ) {
    return await this.clientPersonaService.getClientPersonas(query);
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
    name: 'includeBankAccount',
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
    name: 'includeOrganization',
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
  async getClientPersonaById(
    @Param()
    param: GetClientPersonaByIdParamDto,
    @Query() query: GetClientPersonaByIdQueryDto,
  ) {
    return await this.clientPersonaService.findById([param.id], {
      includeOrganization: {
        value: query.includeOrganization,
        includeOrganizationPerson: {
          value: query.includeOrganizationPerson,
          includePerson: {
            value: query.includePerson,
          },
        },
        includeBankAccount: {
          value: query.includeBankAccount,
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
      },
    });
  }
}
