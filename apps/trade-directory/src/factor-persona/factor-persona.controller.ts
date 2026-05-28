import { FactorPersonaProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import { FactorPersona } from '@app/common/apps/trade-directory/proto/entity';
import {
  CreateFactorPersonaDto,
  FactorPersonaByIdDto,
  FactorPersonaGrpcServiceController,
  FactorPersonaGrpcServiceControllerMethods,
  FactorPersonaList,
  GetAllFactorPersonaDto,
  UpdateFactorPersonaDto,
} from '@app/common/apps/trade-directory/proto/factor-persona';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetFactorPersonaByIdParamDto,
  GetFactorPersonaByIdQueryDto,
} from './dtos/get-factor-persona-by-id.dto';
import { GetFactorPersonasQueryDto } from './dtos/get-factor-personas.dto';
import { FactorPersonaService } from './factor-persona.service';

@Controller('factor-persona')
@FactorPersonaGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class FactorPersonaController
  implements FactorPersonaGrpcServiceController
{
  constructor(private readonly factorPersonaService: FactorPersonaService) {}

  async getAllGrpc(
    request: GetAllFactorPersonaDto,
  ): Promise<FactorPersonaList> {
    const data = await this.factorPersonaService.getAll({
      includeOrganization: request.includeOrganization,
    });
    const response: FactorPersonaList = {
      factorPersonas: data.map((factorPersona) =>
        FactorPersonaProtoConverter.convertToProto(factorPersona),
      ),
    };
    return response;
  }

  async findByIdGrpc(
    request: FactorPersonaByIdDto,
  ): Promise<FactorPersonaList> {
    const data = await this.factorPersonaService.findById(request.id, {
      includeOrganization: request.includeOrganization,
    });
    const response: FactorPersonaList = {
      factorPersonas: data.map((factorPersona) =>
        FactorPersonaProtoConverter.convertToProto(factorPersona),
      ),
    };
    return response;
  }

  async createGrpc(request: CreateFactorPersonaDto): Promise<FactorPersona> {
    const data = await this.factorPersonaService.createFactorPersona(
      request.organizationId,
      FactorPersonaProtoConverter.convertToUpdatableApp(request.factorPersona),
    );
    const response = FactorPersonaProtoConverter.convertToProto(data);
    return response;
  }

  async updateGrpc(request: UpdateFactorPersonaDto): Promise<FactorPersona> {
    const data = await this.factorPersonaService.updateFactorPersona(
      request.id,
      FactorPersonaProtoConverter.convertToUpdatableApp(request.factorPersona),
    );
    const response = FactorPersonaProtoConverter.convertToProto(data);
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
  async getFactorPersonas(
    @Query()
    query: GetFactorPersonasQueryDto,
  ) {
    return await this.factorPersonaService.getFactorPersonas(query);
  }

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
  async getFactorPersonaById(
    @Param()
    param: GetFactorPersonaByIdParamDto,
    @Query() query: GetFactorPersonaByIdQueryDto,
  ) {
    return await this.factorPersonaService.findById([param.id], {
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
        includeContractAwarderPersona: {
          value: query.includeContractAwarderPersona,
        },
        includeSupplierPersona: {
          value: query.includeSupplierPersona,
        },
      },
    });
  }
}
