import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { BankAccount, Organization, Person } from '../models';
import {
  BankAccountRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';

@Module({
  imports: [DatabaseModule.forFeature([BankAccount, Organization, Person])],
  controllers: [BankAccountController],
  providers: [
    BankAccountService,
    BankAccountRepository,
    OrganizationRepository,
    PersonRepository,
  ],
  exports: [BankAccountService],
})
export class BankAccountModule {}
