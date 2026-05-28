import { ApplicationPublicContext } from '@app/common/decorators/application-public-context.decorator';
import { ApplicationPublicGuard } from '@app/common/guards/application-public/applicaton-public.guard';
import { ApplicationPublicGuardResponseDto } from '@app/common/guards/application-public/dtos/application-public-guard-response.dto';
import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import { BankAccountService } from '../bank-account/bank-account.service';
import { GetBankAccountsQueryDto } from '../bank-account/dtos/get-bank-accounts.dto';
import { ExperianService } from '../experian/experian.service';
import { GetOrganizationPersonsQueryDto } from '../organization-person/dtos/get-organization-persons.dto';
import { OrganizationPersonService } from '../organization-person/organization-person.service';
import { GetOrganizationQueryDto } from '../organization/dtos/get-organization.dto';
import { OrganizationService } from '../organization/organization.service';

@Controller('application-public')
export class ApplicationPublicController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationPersonService: OrganizationPersonService,
    private readonly bankAccountService: BankAccountService,
    private readonly experianService: ExperianService,
  ) {}

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
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Get('/:applicationPublicUuid/organization')
  async getOrganization(
    @Query() query: GetOrganizationQueryDto,
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    const [clientOrganization] =
      await this.organizationService.findByClientPersonaId(
        [applicationPublicContext.clientPersonaId],
        {
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
      );
    if (!clientOrganization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      clientOrganization,
    };
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
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Get('/:applicationPublicUuid/organization-person')
  async getOrganizationPersons(
    @Query()
    query: GetOrganizationPersonsQueryDto,
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.organizationPersonService.getOrganizationPersons(
      { clientPersonaId: applicationPublicContext.clientPersonaId },
      query,
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
    name: 'accountHolderName',
    required: false,
    type: String,
  })
  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Get('/:applicationPublicUuid/bank-account')
  async getBankAccounts(
    @Query()
    query: GetBankAccountsQueryDto,
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.bankAccountService.getBankAccounts(
      { clientPersonaId: applicationPublicContext.clientPersonaId },
      query,
    );
  }

  @ApiParam({
    name: 'applicationPublicUuid',
    required: true,
    type: String,
  })
  @UseGuards(ApplicationPublicGuard)
  @Get('/:applicationPublicUuid/experian')
  async getExperians(
    @ApplicationPublicContext()
    applicationPublicContext: ApplicationPublicGuardResponseDto,
  ) {
    return await this.experianService.getExperians(
      applicationPublicContext.clientPersonaId,
    );
  }
}
