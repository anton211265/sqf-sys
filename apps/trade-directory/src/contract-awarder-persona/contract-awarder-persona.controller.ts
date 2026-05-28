import { ContractAwarderPersonaProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  ContractAwarderPersonaByIdDto,
  ContractAwarderPersonaGrpcServiceController,
  ContractAwarderPersonaGrpcServiceControllerMethods,
  ContractAwarderPersonaList,
  CreateContractAwarderPersonaDto,
  GetAllContractAwarderPersonaDto,
  UpdateContractAwarderPersonaDto,
} from '@app/common/apps/trade-directory/proto/contract-awarder-persona';
import { ContractAwarderPersona } from '@app/common/apps/trade-directory/proto/entity';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { ContractAwarderPersonaService } from './contract-awarder-persona.service';
import {
  GetContractAwarderPersonaByIdParamDto,
  GetContractAwarderPersonaByIdQueryDto,
} from './dtos/get-contract-awarder-persona-by-id.dto';
import { GetContractAwardersQueryDto } from './dtos/get-contract-awarder-personas.dto';

@Controller('contract-awarder-persona')
@ContractAwarderPersonaGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class ContractAwarderPersonaController
  implements ContractAwarderPersonaGrpcServiceController
{
  constructor(
    private readonly contractAwarderPersonaService: ContractAwarderPersonaService,
  ) {}

  async getAllGrpc(
    request: GetAllContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersonaList> {
    const data = await this.contractAwarderPersonaService.getAll({
      includeOrganization: request.includeOrganization,
    });
    const response: ContractAwarderPersonaList = {
      contractAwarderPersonas: data.map((contractAwarderPersona) =>
        ContractAwarderPersonaProtoConverter.convertToProto(
          contractAwarderPersona,
        ),
      ),
    };
    return response;
  }

  async findByIdGrpc(
    request: ContractAwarderPersonaByIdDto,
  ): Promise<ContractAwarderPersonaList> {
    const data = await this.contractAwarderPersonaService.findById(request.id, {
      includeOrganization: request.includeOrganization,
    });
    const response: ContractAwarderPersonaList = {
      contractAwarderPersonas: data.map((contractAwarderPersona) =>
        ContractAwarderPersonaProtoConverter.convertToProto(
          contractAwarderPersona,
        ),
      ),
    };
    return response;
  }

  async createGrpc(
    request: CreateContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersona> {
    const data =
      await this.contractAwarderPersonaService.createContractAwarderPersona(
        request.organizationId,
        ContractAwarderPersonaProtoConverter.convertToUpdatableApp(
          request.contractAwarderPersona,
        ),
      );
    const response = ContractAwarderPersonaProtoConverter.convertToProto(data);
    return response;
  }

  async updateGrpc(
    request: UpdateContractAwarderPersonaDto,
  ): Promise<ContractAwarderPersona> {
    const data =
      await this.contractAwarderPersonaService.updateContractAwarderPersona(
        request.id,
        ContractAwarderPersonaProtoConverter.convertToUpdatableApp(
          request.contractAwarderPersona,
        ),
      );
    const response = ContractAwarderPersonaProtoConverter.convertToProto(data);
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
  async getContractAwarderPersonas(
    @Query()
    query: GetContractAwardersQueryDto,
  ) {
    return await this.contractAwarderPersonaService.getContractAwarderPersonas(
      query,
    );
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
  async getContractAwarderPersonaById(
    @Param()
    param: GetContractAwarderPersonaByIdParamDto,
    @Query() query: GetContractAwarderPersonaByIdQueryDto,
  ) {
    return await this.contractAwarderPersonaService.findById([param.id], {
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
        includeClientPersona: {
          value: query.includeClientPersona,
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
