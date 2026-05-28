import { BankAccountProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  BankAccountByIdDto,
  BankAccountByOrganizationIdDto,
  BankAccountGrpcServiceController,
  BankAccountGrpcServiceControllerMethods,
  BankAccountList,
  CreateBankAccountDto,
  GetAllBankAccountDto,
  UpdateBankAccountDto,
} from '@app/common/apps/trade-directory/proto/bank-account';
import { BankAccount } from '@app/common/apps/trade-directory/proto/entity';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { BankAccountService } from './bank-account.service';
import {
  GetBankAccountsParamsDto,
  GetBankAccountsQueryDto,
} from './dtos/get-bank-accounts.dto';

@Controller('bank-account')
@BankAccountGrpcServiceControllerMethods()
@ApiBearerAuth('id-token')
export class BankAccountController implements BankAccountGrpcServiceController {
  constructor(private readonly bankAccountService: BankAccountService) {}

  async getAllGrpc(request: GetAllBankAccountDto): Promise<BankAccountList> {
    const data = await this.bankAccountService.getAll({
      includeOrganization: request.includeOrganization,
      includePerson: request.includePerson,
    });
    const response: BankAccountList = {
      bankAccounts: data.map((person) =>
        BankAccountProtoConverter.convertToProto(person),
      ),
    };
    return response;
  }

  async findByIdGrpc(request: BankAccountByIdDto): Promise<BankAccountList> {
    const data = await this.bankAccountService.getAll({
      includeOrganization: request.includeOrganization,
      includePerson: request.includePerson,
    });
    const response: BankAccountList = {
      bankAccounts: data.map((person) =>
        BankAccountProtoConverter.convertToProto(person),
      ),
    };
    return response;
  }

  async findByOrganizationIdGrpc(
    request: BankAccountByOrganizationIdDto,
  ): Promise<BankAccountList> {
    const data = await this.bankAccountService.findByOrganizationId(
      request.organizationId,
    );

    const response: BankAccountList = {
      bankAccounts: data.map((bankAccount) =>
        BankAccountProtoConverter.convertToProto(bankAccount),
      ),
    };
    return response;
  }

  async createGrpc(request: CreateBankAccountDto): Promise<BankAccount> {
    const data = await this.bankAccountService.createBankAccount(
      {
        organizationId: request.organizationId,
        personId: request.personId,
      },
      BankAccountProtoConverter.convertToUpdatableApp(request.bankAccount),
    );
    return BankAccountProtoConverter.convertToProto(data);
  }

  async updateGrpc(request: UpdateBankAccountDto): Promise<BankAccount> {
    const data = await this.bankAccountService.updateBankAccount(
      request.id,
      BankAccountProtoConverter.convertToUpdatableApp(request.bankAccount),
    );
    return BankAccountProtoConverter.convertToProto(data);
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
    name: 'organizationId',
    required: true,
    type: Number,
  })
  @UseGuards(AuthGuard)
  @Get('/:organizationId')
  async getBankAccounts(
    @Param() param: GetBankAccountsParamsDto,
    @Query()
    query: GetBankAccountsQueryDto,
  ) {
    return await this.bankAccountService.getBankAccounts(
      { organizationId: param.organizationId },
      query,
    );
  }
}
