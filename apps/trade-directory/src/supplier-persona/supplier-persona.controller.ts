import { SupplierPersonaProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import { SupplierPersona } from '@app/common/apps/trade-directory/proto/entity';
import {
  CreateSupplierPersonaDto,
  GetAllSupplierPersonaDto,
  SupplierPersonaByIdDto,
  SupplierPersonaGrpcServiceController,
  SupplierPersonaGrpcServiceControllerMethods,
  SupplierPersonaList,
  UpdateSupplierPersonaDto,
} from '@app/common/apps/trade-directory/proto/supplier-persona';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import {
  GetSupplierPersonaByIdParamDto,
  GetSupplierPersonaByIdQueryDto,
} from './dtos/get-supplier-persona-by-id.dto';
import { GetSupplierPersonasQueryDto } from './dtos/get-supplier-personas.dto';
import { SupplierPersonaService } from './supplier-persona.service';

@Controller('supplier-persona')
@SupplierPersonaGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class SupplierPersonaController
  implements SupplierPersonaGrpcServiceController
{
  constructor(
    private readonly supplierPersonaService: SupplierPersonaService,
  ) {}

  async getAllGrpc(
    request: GetAllSupplierPersonaDto,
  ): Promise<SupplierPersonaList> {
    const data = await this.supplierPersonaService.getAll({
      includeOrganization: request.includeOrganization,
    });
    const response: SupplierPersonaList = {
      supplierPersonas: data.map((supplierPersona) =>
        SupplierPersonaProtoConverter.convertToProto(supplierPersona),
      ),
    };
    return response;
  }

  async findByIdGrpc(
    request: SupplierPersonaByIdDto,
  ): Promise<SupplierPersonaList> {
    const data = await this.supplierPersonaService.findById(request.id, {
      includeOrganization: request.includeOrganization,
    });
    const response: SupplierPersonaList = {
      supplierPersonas: data.map((supplierPersona) =>
        SupplierPersonaProtoConverter.convertToProto(supplierPersona),
      ),
    };
    return response;
  }

  async createGrpc(
    request: CreateSupplierPersonaDto,
  ): Promise<SupplierPersona> {
    const data = await this.supplierPersonaService.createSupplierPersona(
      request.organizationId,
      SupplierPersonaProtoConverter.convertToUpdatableApp(
        request.supplierPersona,
      ),
    );
    const response = SupplierPersonaProtoConverter.convertToProto(data);
    return response;
  }

  async updateGrpc(
    request: UpdateSupplierPersonaDto,
  ): Promise<SupplierPersona> {
    const data = await this.supplierPersonaService.updateSupplierPersona(
      request.id,
      SupplierPersonaProtoConverter.convertToUpdatableApp(
        request.supplierPersona,
      ),
    );
    const response = SupplierPersonaProtoConverter.convertToProto(data);
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
  async getSupplierPersonas(
    @Query()
    query: GetSupplierPersonasQueryDto,
  ) {
    return await this.supplierPersonaService.getSupplierPersonas(query);
  }

  @ApiQuery({
    name: 'includeFactorPersona',
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
  async getSupplierPersonaById(
    @Param()
    param: GetSupplierPersonaByIdParamDto,
    @Query() query: GetSupplierPersonaByIdQueryDto,
  ) {
    return await this.supplierPersonaService.findById([param.id], {
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
        includeFactorPersona: {
          value: query.includeFactorPersona,
        },
      },
    });
  }
}
