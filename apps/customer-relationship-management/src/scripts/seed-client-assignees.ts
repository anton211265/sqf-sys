import { ClientPersonaProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import {
  CLIENT_PERSONA_GRPC_SERVICE_NAME,
  ClientPersonaGrpcServiceClient,
} from '@app/common/apps/trade-directory/proto/client-persona';
import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import { NestFactory } from '@nestjs/core';
import { ClientGrpc } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { firstValueFrom } from 'rxjs';
import { CustomerRelationshipManagementModule } from '../customer-relationship-management.module';
import { ClientAssignee } from '../models';
import { ClientAssigneeRepository } from '../repositories';

async function bootstrap() {
  const app = await NestFactory.create(CustomerRelationshipManagementModule);
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  logger.log('Seeding client assignees...');
  const tradeDirectoryGrpcClient = app.get<ClientGrpc>(
    DependencyInjectionTokenEnum.TRADE_DIRECTORY_GRPC_CLIENT,
  );
  const clientPersonaGrpcService =
    tradeDirectoryGrpcClient.getService<ClientPersonaGrpcServiceClient>(
      CLIENT_PERSONA_GRPC_SERVICE_NAME,
    );
  const clientAssigneeRepository = app.get(ClientAssigneeRepository);

  const { clientPersonas: protoClientPersonas } = await firstValueFrom(
    clientPersonaGrpcService.getAllGrpc({
      includeOrganization: {
        value: true,
      },
    }),
  );

  const clientPersonas = protoClientPersonas.map((protoClientPersona) =>
    ClientPersonaProtoConverter.convertToApp(protoClientPersona),
  );

  for (const clientPersona of clientPersonas) {
    logger.log(
      `Seeding client assignees for client persona id: ${clientPersona.id}...`,
    );
    if (!clientPersona.organization) {
      logger.warn(
        `Client persona id: ${clientPersona.id} does not have an organization. Skipping...`,
      );
      continue;
    }
    const clientAssigneeSeed = new ClientAssignee({
      clientPersonaId: clientPersona.id,
      clientOrganizationName: clientPersona.organization.organizationName,
    });
    await clientAssigneeRepository.upsert(
      { clientPersonaId: clientPersona.id },
      clientAssigneeSeed,
    );
  }
}
bootstrap();
