import { NestFactory } from '@nestjs/core';
import { parse } from 'date-fns';
import { Logger } from 'nestjs-pino';
import {
  ClientPersona,
  ContractAwarderPersona,
  Organization,
  SupplierPersona,
} from '../models';
import { Transaction } from '../models/transaction.entity';
import {
  ClientPersonaRepository,
  ContractAwarderPersonaRepository,
  OrganizationRepository,
  SupplierPersonaRepository,
} from '../repositories';
import { TransactionRepository } from '../repositories/transaction.repository';
import { TradeDirectoryModule } from '../trade-directory.module';
import * as json from './data/gl.json';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  logger.log('Seeding GL...');
  const transactionRepository = app.get(TransactionRepository);
  const organizationRepository = app.get(OrganizationRepository);
  const clientPersonaRepository = app.get(ClientPersonaRepository);
  const contractAwarderPersonaRepository = app.get(
    ContractAwarderPersonaRepository,
  );
  const supplierPersonaRepository = app.get(SupplierPersonaRepository);
  const data: any[] = json as any[];
  for (const datum of data) {
    logger.log(`Seeding transaction ID: ${datum.ID}...`);
    let clientPersonaFirstParty: ClientPersona = null;
    let contractAwarderPersonaFirstParty: ContractAwarderPersona = null;
    let supplierFirstParty: SupplierPersona = null;
    let clientPersonaSecondParty: ClientPersona = null;
    let contractAwarderPersonaSecondParty: ContractAwarderPersona = null;
    let supplierSecondParty: SupplierPersona = null;

    if (datum['Company Tagging1'] !== null) {
      const organizationSeed = new Organization({
        organizationName: datum['Company Tagging1'],
      });

      const organization = await organizationRepository.upsert(
        { organizationName: organizationSeed.organizationName },
        organizationSeed,
      );

      if (datum['Role 1'] === 'Client') {
        const clientPersonaSeed = new ClientPersona({
          organization: organization,
        });
        clientPersonaFirstParty = await clientPersonaRepository.upsert(
          {
            organization: {
              id: organization.id,
            },
          },
          clientPersonaSeed,
        );
      } else if (datum['Role 1'] === 'Contract Awarder') {
        const contractAwarderPersonaSeed = new ContractAwarderPersona({
          organization: organization,
        });
        contractAwarderPersonaFirstParty =
          await contractAwarderPersonaRepository.upsert(
            {
              organization: {
                id: organization.id,
              },
            },
            contractAwarderPersonaSeed,
          );
      } else if (datum['Role 1'] === 'Supplier') {
        const supplierPersonaSeed = new SupplierPersona({
          organization: organization,
        });
        supplierFirstParty = await supplierPersonaRepository.upsert(
          {
            organization: {
              id: organization.id,
            },
          },
          supplierPersonaSeed,
        );
      }
    }

    if (datum['Company Tagging2'] !== null) {
      const organizationSeed = new Organization({
        organizationName: datum['Company Tagging2'],
      });

      const organization = await organizationRepository.upsert(
        { organizationName: organizationSeed.organizationName },
        organizationSeed,
      );

      if (datum['Role 2'] === 'Client') {
        const clientPersonaSeed = new ClientPersona({
          organization: organization,
        });
        clientPersonaSecondParty = await clientPersonaRepository.upsert(
          {
            organization: {
              id: organization.id,
            },
          },
          clientPersonaSeed,
        );
      } else if (datum['Role 2'] === 'Contract Awarder') {
        const contractAwarderPersonaSeed = new ContractAwarderPersona({
          organization: organization,
        });
        contractAwarderPersonaSecondParty =
          await contractAwarderPersonaRepository.upsert(
            {
              organization: {
                id: organization.id,
              },
            },
            contractAwarderPersonaSeed,
          );
      } else if (datum['Role 2'] === 'Supplier') {
        const supplierPersonaSeed = new SupplierPersona({
          organization: organization,
        });
        supplierSecondParty = await supplierPersonaRepository.upsert(
          {
            organization: {
              id: organization.id,
            },
          },
          supplierPersonaSeed,
        );
      }
    }

    const transaction = new Transaction({
      date: parse(datum.Date, 'dd/MM/yyyy', new Date()),
      ref: datum['Ref. 1/2'],
      description1: datum['Description 1'],
      description2: datum['Description 2'],
      debit: numericConverter(datum['Debit(RM)']),
      credit: numericConverter(datum['Credit(RM)']),
      balance: numericConverter(datum['Balance(RM)']),
      parameter: datum.Parameter,
      facility: datum.facility,
      details: datum.details,
      firstPartyAsClientPersona: clientPersonaFirstParty,
      secondPartyAsClientPersona: clientPersonaSecondParty,
      firstPartyAsContractAwarderPersona: contractAwarderPersonaFirstParty,
      secondPartyAsContractAwarderPersona: contractAwarderPersonaSecondParty,
      firstPartyAsSupplierPersona: supplierFirstParty,
      secondPartyAsSupplierPersona: supplierSecondParty,
    });
    await transactionRepository.save(transaction);
  }
}
bootstrap();

function numericConverter(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }

  let result = value.replace(/,/g, '');
  if (result.startsWith('(') && result.endsWith(')')) {
    result = '-' + result.slice(1, -1);
  }
  return parseFloat(result);
}
// {
//   'ID',
//   'Date',
//   'Ref. 1/2',
//   'Description 1',
//   'Description 2',
//   'Debit(RM)',
//   'Credit(RM)',
//   'Balance(RM)',
//   'Company Tagging1',
//   'Company Tagging2',
//   'Parameter',
//   'facility',
//   'details',
//   'Role 1',
//   'Role 2',
//   'Relation'
// }
