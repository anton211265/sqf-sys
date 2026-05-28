import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import {
  FactorPersona,
  Organization,
  OrganizationPerson,
  OrganizationPersonRole,
  Person,
} from '../models';
import {
  FactorPersonaRepository,
  OrganizationPersonRepository,
  OrganizationRepository,
  PersonRepository,
} from '../repositories';
import { TradeDirectoryModule } from '../trade-directory.module';

async function bootstrap() {
  const app = await NestFactory.create(TradeDirectoryModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);
  const configService = app.get(ConfigService);
  const ENTRA_TENANT_ID = configService.getOrThrow('ENTRA_TENANT_ID');

  logger.log('Seeding factor...');
  const organizationRepository = app.get(OrganizationRepository);
  const factorPersonaRepository = app.get(FactorPersonaRepository);
  const personRepository = app.get(PersonRepository);
  const organizationPersonRepository = app.get(OrganizationPersonRepository);

  const factorOrganizationSeed = new Organization({
    organizationName: ENTRA_TENANT_ID,
  });
  const factorOrganization = await organizationRepository.upsert(
    {
      organizationName: factorOrganizationSeed.organizationName,
    },
    factorOrganizationSeed,
  );

  const factorPersonaSeed = new FactorPersona({
    organization: factorOrganization,
  });
  await factorPersonaRepository.upsert(
    {
      organization: {
        id: factorOrganization.id,
      },
    },
    factorPersonaSeed,
  );

  const personSeeds = [
    new Person({
      email: 'danish.rozaki@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Senior Executive 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'nigel.tan@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Senior Executive 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'haziq.hizam@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Senior Executive 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'farikh.ikhwan@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Manager',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'cheng-cheng.lee@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Manager',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'ivan.wiu@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Division Director 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'mashar.rasip@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Associate Director 1',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'badrul.matajuddin@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Client Coverage Associate Director 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CLIENT_COVERAGE,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'adilia.sohaimi@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Corporate Communications Senior Manager 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'nor.fadilah@elnuwr.com',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Customer Success Assistant Manager 2',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CUSTOMER_SUCCESS,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'ivanna.loh@luminorcapital.com.my',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'CEO',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.CEO,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'richard.lim@luminorcapital.com.my',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'COO',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.COO,
            }),
          ],
        }),
      ],
    }),
    new Person({
      email: 'weinie.pui@luminorcapital.com.my',
      organizationPersons: [
        new OrganizationPerson({
          organization: factorOrganization,
          designation: 'Corporate Finance Division Director 1',
          organizationPersonRoles: [
            new OrganizationPersonRole({
              role: OrganizationPersonRoleEnum.SUPERUSER,
            }),
          ],
        }),
      ],
    }),
  ];

  for (const personSeed of personSeeds) {
    const seed = new Person({
      email: personSeed.email,
    });
    const person = await personRepository.upsert(
      {
        email: personSeed.email,
      },
      seed,
    );

    for (const organizationPersonSeed of personSeed.organizationPersons) {
      const seed = new OrganizationPerson({
        person,
        organization: organizationPersonSeed.organization,
        designation: organizationPersonSeed.designation,
      });
      let organizationPerson = await organizationPersonRepository.upsert(
        {
          person: {
            id: person.id,
          },
          organization: {
            id: organizationPersonSeed.organization.id,
          },
        },
        seed,
      );

      organizationPerson =
        await organizationPersonRepository.findOneOrThrowException({
          where: {
            id: organizationPerson.id,
          },
          relations: {
            organizationPersonRoles: true,
          },
        });

      const isSimilarRoles =
        organizationPersonSeed.organizationPersonRoles.length ===
          organizationPerson.organizationPersonRoles.length &&
        organizationPersonSeed.organizationPersonRoles.every((sopr) =>
          organizationPerson.organizationPersonRoles.some(
            (opr) => sopr.role === opr.role,
          ),
        );
      if (isSimilarRoles) {
        continue;
      }

      logger.log(
        `Updating organization person roles for person: ${person.email}`,
      );
      organizationPerson.organizationPersonRoles =
        organizationPersonSeed.organizationPersonRoles.map(
          (sopr) => new OrganizationPersonRole({ role: sopr.role }),
        );
      await organizationPersonRepository.save(organizationPerson);
    }
  }
}
bootstrap();
