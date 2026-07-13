import { CreateClientAssigneeMessage } from '@app/common/apps/customer-relationship-management/types/kafka-message.type';
import {
  OrganizationProtoConverter,
  PersonProtoConverter,
} from '@app/common/apps/trade-directory/proto-converter';
import {
  ORGANIZATION_GRPC_SERVICE_NAME,
  OrganizationGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/organization';
import {
  PERSON_GRPC_SERVICE_NAME,
  PersonGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/person';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  AppActions,
  CaslAbilityFactory,
} from '@app/common/modules/casl/casl-ability.factory';
import { ForbiddenError } from '@casl/ability';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EntityManager, ILike } from 'typeorm';
import { ClientAssignee } from '../models';
import { ClientAssigneeRepository, ProcessedEventRepository } from '../repositories';

type GetClientAssigneesArgs = {
  clientOrganizationName?: string;
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class ClientAssigneeService implements OnModuleInit {
  private readonly logger = new Logger(ClientAssigneeService.name);
  private personService: PersonGrpcServiceClient;
  private organizationService: OrganizationGrpcServiceClient;

  constructor(
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly clientAssigneeRepository: ClientAssigneeRepository,
    private readonly processedEventRepository: ProcessedEventRepository,
    private readonly entityManager: EntityManager,
    @Inject(DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT)
    private readonly tradeDirectoryGrpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.personService =
      this.tradeDirectoryGrpcClient.getService<PersonGrpcServiceClient>(
        PERSON_GRPC_SERVICE_NAME,
      );
    this.organizationService =
      this.tradeDirectoryGrpcClient.getService<OrganizationGrpcServiceClient>(
        ORGANIZATION_GRPC_SERVICE_NAME,
      );
  }

  getClientAssignees = async ({
    clientOrganizationName,
    pageSize = 50,
    pageNumber = 1,
  }: GetClientAssigneesArgs) => {
    const [clientAssignees, totalCount] =
      await this.clientAssigneeRepository.findAndCount({
        where: {
          clientOrganizationName: clientOrganizationName
            ? ILike(`%${clientOrganizationName}%`)
            : undefined,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    const clientPersonaIds = clientAssignees.map(
      (clientAssignee) => clientAssignee.clientPersonaId,
    );

    const { organizations: protoClientOrganizations } = await firstValueFrom(
      this.organizationService.findByClientPersonaIdGrpc({
        clientPersonaId: clientPersonaIds,
      }),
    );

    const clientOrganizations = protoClientOrganizations.map(
      (protoClientOrganization) =>
        OrganizationProtoConverter.convertToApp(protoClientOrganization),
    );

    clientAssignees.forEach((clientAssignee) => {
      const clientOrganization = clientOrganizations.find(
        (clientOrganization) =>
          clientOrganization.clientPersonaId === clientAssignee.clientPersonaId,
      );
      clientAssignee.clientOrganization = clientOrganization;
    });

    const personIds = clientAssignees.map(
      (clientAssignee) => clientAssignee.assigneePersonId,
    );

    const { persons: protoAssigneePersons } = await firstValueFrom(
      this.personService.findByIdGrpc({ id: personIds }),
    );

    const assigneePersons = protoAssigneePersons.map((protoAssigneePerson) =>
      PersonProtoConverter.convertToApp(protoAssigneePerson),
    );

    clientAssignees.forEach((clientAssignee) => {
      const assigneePerson = assigneePersons.find(
        (assigneePerson) =>
          assigneePerson.id === clientAssignee.assigneePersonId,
      );
      clientAssignee.assigneePerson = assigneePerson;
    });

    return {
      clientAssignees,
      pageNumber,
      pageSize,
      currentCount: Math.min(clientAssignees.length, pageSize),
      totalCount,
    };
  };

  getMyClientAssignees = async (
    {
      clientOrganizationName,
      pageSize = 50,
      pageNumber = 1,
    }: GetClientAssigneesArgs,
    userContext: AuthResponseDto,
  ) => {
    const ability = this.caslAbilityFactory.createForUser(userContext);
    ForbiddenError.from(ability).throwUnlessCan(
      AppActions.Read,
      new ClientAssignee({
        assigneePersonId: userContext.personId,
      }),
    );

    const [clientAssignees, totalCount] =
      await this.clientAssigneeRepository.findAndCount({
        where: {
          clientOrganizationName: clientOrganizationName
            ? ILike(`%${clientOrganizationName}%`)
            : undefined,
          assigneePersonId: userContext.personId,
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    const clientPersonaIds = clientAssignees.map(
      (clientAssignee) => clientAssignee.clientPersonaId,
    );

    const { organizations: protoClientOrganizations } = await firstValueFrom(
      this.organizationService.findByClientPersonaIdGrpc({
        clientPersonaId: clientPersonaIds,
      }),
    );

    const clientOrganizations = protoClientOrganizations.map(
      (protoClientOrganization) =>
        OrganizationProtoConverter.convertToApp(protoClientOrganization),
    );

    clientAssignees.forEach((clientAssignee) => {
      const clientOrganization = clientOrganizations.find(
        (clientOrganization) =>
          clientOrganization.clientPersonaId === clientAssignee.clientPersonaId,
      );
      clientAssignee.clientOrganization = clientOrganization;
    });

    const personIds = clientAssignees.map(
      (clientAssignee) => clientAssignee.assigneePersonId,
    );

    const { persons: protoAssigneePersons } = await firstValueFrom(
      this.personService.findByIdGrpc({ id: personIds }),
    );

    const assigneePersons = protoAssigneePersons.map((protoAssigneePerson) =>
      PersonProtoConverter.convertToApp(protoAssigneePerson),
    );

    clientAssignees.forEach((clientAssignee) => {
      const assigneePerson = assigneePersons.find(
        (assigneePerson) =>
          assigneePerson.id === clientAssignee.assigneePersonId,
      );
      clientAssignee.assigneePerson = assigneePerson;
    });

    return {
      clientAssignees,
      pageNumber,
      pageSize,
      currentCount: Math.min(clientAssignees.length, pageSize),
      totalCount,
    };
  };

  assignClientAssignee = async (
    clientAssigneeId: number,
    assigneePersonId: number,
  ) => {
    const clientAssignee =
      await this.clientAssigneeRepository.findOneOrThrowException({
        where: {
          id: clientAssigneeId,
        },
      });

    clientAssignee.assigneePersonId = assigneePersonId;
    return await this.clientAssigneeRepository.save(clientAssignee);
  };

  createClientAssigneeEvent = async (args: CreateClientAssigneeMessage) => {
    if (await this.processedEventRepository.exists(args.eventId)) {
      this.logger.warn(
        `Skipping already-processed CREATE_CLIENT_ASSIGNEE event: ${args.eventId}`,
      );
      return;
    }

    const {
      organizations: [protoClientOrganization],
    } = await firstValueFrom(
      this.organizationService.findByClientPersonaIdGrpc({
        clientPersonaId: [args.data.clientPersonaId],
      }),
    );

    if (!protoClientOrganization) {
      this.logger.error(
        `Client organization not found for client persona id: ${args.data.clientPersonaId}`,
      );
    }

    const clientOrganization = OrganizationProtoConverter.convertToApp(
      protoClientOrganization,
    );

    const clientAssignee: Required<ClientAssignee> = {
      id: undefined,
      clientPersonaId: args.data.clientPersonaId,
      clientOrganizationName: clientOrganization.organizationName,
      clientOrganization: undefined,
      assigneePersonId: args.data.assigneePersonId,
      assigneePerson: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    };

    await this.entityManager.transaction(async (manager) => {
      await manager.save(ClientAssignee, clientAssignee);
      await this.processedEventRepository.record(manager, {
        id: args.eventId,
        topic: KafkaTopicEnum.CREATE_CLIENT_ASSIGNEE,
      });
    });
  };
}
