import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { IsInt, Min } from 'class-validator';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ProcessedEventRepository } from '../repositories/processed-event.repository';
import { WebIntakeService } from './web-intake.service';

class AssignIntakeDto {
  @IsInt()
  @Min(1)
  rmPersonId: number;
}

/** RM Supervisor "new applicants (web)" queue endpoints. */
@Controller('api/crm/applicants-web')
@UseGuards(RemotePermissionGuard)
export class WebIntakeController {
  constructor(private readonly webIntakeService: WebIntakeService) {}

  @Get()
  @RequirePermission('crm_supervisor_view')
  list(@Req() req: any) {
    return this.webIntakeService.list(req.userContext.orgId);
  }

  /** My Clients (blueprint: RM sees own; supervisors see the team). */
  @Get('/clients')
  @RequirePermission('onboarding_clients_view')
  listClients(@Req() req: any) {
    const supervisor =
      req.userContext.isSuperAdmin === true ||
      req.userContext.permissions?.has?.('crm_supervisor_view') === true;
    return this.webIntakeService.listClients(req.userContext.orgId, req.userContext.id, supervisor);
  }

  @Post(':id/assign')
  @RequirePermission('crm_assignees_manage')
  assign(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: AssignIntakeDto) {
    return this.webIntakeService.assign(req.userContext.orgId, id, dto.rmPersonId);
  }
}

/** APPLICATION_SCORED consumer — projects web-intake rows (idempotent). */
@Controller()
export class WebIntakeConsumerController {
  private readonly logger = new Logger(WebIntakeConsumerController.name);

  constructor(
    private readonly webIntakeService: WebIntakeService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.CLIENT_ONBOARDED)
  async handleClientOnboarded(@Payload() event: any): Promise<void> {
    try {
      if (!event?.eventId || !Number.isInteger(event?.applicationId)) return;
      if (await this.processedEventRepository.exists(event.eventId)) return;
      await this.webIntakeService.markClientOnboarded(event.applicationId);
      await this.entityManager.transaction(async (manager) => {
        await this.processedEventRepository.record(manager, {
          id: event.eventId,
          topic: KafkaTopicEnum.CLIENT_ONBOARDED,
        });
      });
      this.logger.log(`Client onboarded: application ${event.applicationId} (${event.companyName ?? ''})`);
    } catch (error) {
      this.logger.error(`CLIENT_ONBOARDED handling failed (dropped): ${(error as Error).message}`);
    }
  }

  @EventPattern(KafkaTopicEnum.APPLICATION_SCORED)
  async handleApplicationScored(@Payload() event: any): Promise<void> {
    // Malformed/poison messages are logged and dropped — never wedge the
    // consumer group (house rule, same as the SLA engine's consumers).
    try {
      if (
        !event?.eventId ||
        !Number.isInteger(event?.applicationId) ||
        !Number.isInteger(event?.funderOrganizationId) ||
        !Number.isInteger(event?.organizationId) ||
        (event?.result !== 'PASS' && event?.result !== 'FAIL')
      ) {
        this.logger.warn(`Dropping malformed APPLICATION_SCORED event: ${JSON.stringify(event)?.slice(0, 200)}`);
        return;
      }
      if (await this.processedEventRepository.exists(event.eventId)) return;
      await this.webIntakeService.upsertFromEvent(event);
      await this.entityManager.transaction(async (manager) => {
        await this.processedEventRepository.record(manager, {
          id: event.eventId,
          topic: KafkaTopicEnum.APPLICATION_SCORED,
        });
      });
      this.logger.log(
        `Web-intake projection updated: application ${event.applicationNumber} ${event.result}`,
      );
    } catch (error) {
      this.logger.error(
        `APPLICATION_SCORED handling failed (dropped): ${(error as Error).message}`,
      );
    }
  }
}
