import { v4 as uuid } from 'uuid';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ApplicationSupportingDocumentTypeEnum } from '@app/common/apps/risk-operation/enums/application-supporting-document-type.enum';
import {
  DocumentRequest,
  DocumentRequestStatusEnum,
} from '../models/document-request.entity';
import { OutboxEventRepository } from '../repositories';

/**
 * Default required-document set for the prototype. The brief calls for this
 * list to be configured per risk filter — that config entity doesn't exist
 * yet in risk-operation, so this is a placeholder until that's built.
 */
const DEFAULT_DOCUMENT_TYPES = [
  ApplicationSupportingDocumentTypeEnum.FINANCIAL_STATEMENT,
  ApplicationSupportingDocumentTypeEnum.BANK_STATEMENT,
  ApplicationSupportingDocumentTypeEnum.COMPANY_PROFILE,
];

const DEFAULT_SLA_DAYS = 5;

@Injectable()
export class DocumentRequestService {
  private readonly logger = new Logger(DocumentRequestService.name);

  constructor(
    @InjectRepository(DocumentRequest)
    private readonly documentRequestRepository: Repository<DocumentRequest>,
    private readonly entityManager: EntityManager,
    private readonly outboxEventRepository: OutboxEventRepository,
    private readonly configService: ConfigService,
  ) {}

  private configHraEscalationEmail(): string {
    return this.configService.getOrThrow('HRA_ESCALATION_EMAIL');
  }

  async requestDocumentsAndStartSla(params: {
    applicationId: number;
    applicationNumber: string;
    clientPersonaId: number;
    clientContactEmail: string;
  }): Promise<DocumentRequest> {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + DEFAULT_SLA_DAYS);

    return this.entityManager.transaction(async (manager) => {
      const documentRequest = await manager.save(
        DocumentRequest,
        new DocumentRequest({
          applicationId: params.applicationId,
          applicationNumber: params.applicationNumber,
          documentTypes: DEFAULT_DOCUMENT_TYPES,
          slaDays: DEFAULT_SLA_DAYS,
          dueAt,
          status: DocumentRequestStatusEnum.PENDING,
        }),
      );

      const eventId = uuid();
      await this.outboxEventRepository.record(manager, {
        id: eventId,
        topic: KafkaTopicEnum.SEND_EMAIL,
        payload: {
          eventId,
          emailSender: 'risk@synlian.net',
          emailReceivers: [params.clientContactEmail],
          emailSubject: `Documents required — application ${params.applicationNumber}`,
          emailBody: `We need the following documents to continue processing application ${params.applicationNumber}: ${DEFAULT_DOCUMENT_TYPES.join(
            ', ',
          )}. Please respond by ${dueAt.toDateString()}.`,
        },
      });

      return documentRequest;
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdueRequests() {
    const overdue = await this.documentRequestRepository.find({
      where: {
        status: DocumentRequestStatusEnum.PENDING,
        dueAt: LessThan(new Date()),
      },
    });

    for (const request of overdue) {
      await this.entityManager.transaction(async (manager) => {
        await manager.update(DocumentRequest, request.id, {
          status: DocumentRequestStatusEnum.ESCALATED,
          escalatedAt: new Date(),
        });

        const eventId = uuid();
        await this.outboxEventRepository.record(manager, {
          id: eventId,
          topic: KafkaTopicEnum.SEND_EMAIL,
          payload: {
            eventId,
            emailSender: 'risk@synlian.net',
            emailReceivers: [this.configHraEscalationEmail()],
            emailSubject: `SLA breach — application ${request.applicationNumber} awaiting documents`,
            emailBody: `Application ${request.applicationNumber} has not returned requested documents (${request.documentTypes.join(
              ', ',
            )}) since it was due on ${request.dueAt.toDateString()}. Please review in the CRC dashboard.`,
          },
        });
      });
      this.logger.warn(
        `Document request for ${request.applicationNumber} overdue — escalated to HRA.`,
      );
    }
  }
}
