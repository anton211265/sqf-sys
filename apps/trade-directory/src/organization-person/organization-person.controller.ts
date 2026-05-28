import { OrganizationPersonProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import { OrganizationPerson } from '@app/common/apps/trade-directory/proto/entity';
import {
  CreateOrganizationPersonDto,
  OrganizationPersonByOrganizationIdDto,
  OrganizationPersonGrpcServiceController,
  OrganizationPersonGrpcServiceControllerMethods,
  OrganizationPersonList,
  UpdateOrganizationPersonDto,
} from '@app/common/apps/trade-directory/proto/organization-person';
import { CheckPolicies } from '@app/common/decorators/check-policies.decorator';
import { AppActions } from '@app/common/modules/casl/casl-ability.factory';
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationPersonRole } from '../models';
import { GetFactorOrganizationPersonsQueryDto } from './dtos/get-factor-organization-persons.dto';
import {
  GetOrganizationPersonsParamsDto,
  GetOrganizationPersonsQueryDto,
} from './dtos/get-organization-persons.dto';
import { UpdateFactorOrganizationPersonRoleBodyDto } from './dtos/update-factor-organization-person-role.dto';
import { OrganizationPersonService } from './organization-person.service';

@Controller('organization-person')
@OrganizationPersonGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class OrganizationPersonController
  implements OrganizationPersonGrpcServiceController
{
  constructor(
    private readonly organizationPersonService: OrganizationPersonService,
  ) {}

  async findByOrganizationIdGrpc(
    request: OrganizationPersonByOrganizationIdDto,
  ): Promise<OrganizationPersonList> {
    const data = await this.organizationPersonService.findByOrganizationId(
      request.organizationId,
      {
        includeOrganization: request.includeOrganization,
        includePerson: request.includePerson,
      },
    );

    const response: OrganizationPersonList = {
      organizationPersons: data.map((organizationPerson) =>
        OrganizationPersonProtoConverter.convertToProto(organizationPerson),
      ),
    };

    return response;
  }

  async createGrpc(
    request: CreateOrganizationPersonDto,
  ): Promise<OrganizationPerson> {
    const data = await this.organizationPersonService.createOrganizationPerson(
      request.organizationId,
      request.personId,
      OrganizationPersonProtoConverter.convertToUpdatableApp(
        request.organizationPerson,
      ),
    );
    return OrganizationPersonProtoConverter.convertToProto(data);
  }

  async updateGrpc(
    request: UpdateOrganizationPersonDto,
  ): Promise<OrganizationPerson> {
    const data = await this.organizationPersonService.updateOrganizationPerson(
      request.id,
      OrganizationPersonProtoConverter.convertToUpdatableApp(
        request.organizationPerson,
      ),
    );
    return OrganizationPersonProtoConverter.convertToProto(data);
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
    name: 'name',
    required: false,
    type: String,
  })
  @UseGuards(AuthGuard)
  @CheckPolicies((ability) =>
    ability.can(AppActions.Read, new OrganizationPersonRole()),
  )
  @Get('/factor')
  async getFactorOrganizationPersons(
    @Query()
    query: GetFactorOrganizationPersonsQueryDto,
  ) {
    return await this.organizationPersonService.getFactorOrganizationPersons(
      query,
    );
  }

  @UseGuards(AuthGuard)
  @CheckPolicies((ability) =>
    ability.can(AppActions.Update, new OrganizationPersonRole()),
  )
  @Put('/factor')
  async updateFactorOrganizationPersonRole(
    @Body() body: UpdateFactorOrganizationPersonRoleBodyDto,
  ) {
    return await this.organizationPersonService.updateFactorOrganizationPersonRole(
      body,
    );
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
    name: 'name',
    required: false,
    type: String,
  })
  @ApiParam({
    name: 'organizationId',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Get('/:organizationId')
  async getOrganizationPersons(
    @Param() param: GetOrganizationPersonsParamsDto,
    @Query()
    query: GetOrganizationPersonsQueryDto,
  ) {
    return await this.organizationPersonService.getOrganizationPersons(
      { organizationId: param.organizationId },
      query,
    );
  }
}
