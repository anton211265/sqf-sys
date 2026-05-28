import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDocumentManagementCronService } from './cron.interface';
import { Cron } from '@nestjs/schedule';
import {
  HandlePendingLLMExtractionConfig,
  HandlePendingExtractionWebhookConfig,
  HandlePendingConsensusMessagingWebhookConfig,
  HandlePendingOCRConfig,
} from './cron-config';
import {
  DocumentExtraction,
  DocumentExtractionStatus,
} from '../models/document-extraction.entity';
import { EntityManager } from 'typeorm';
import { Webhook, WebhookEventType } from '../models/webhook.entity';
import { ConfigService } from '@nestjs/config';
import { WebhookLog, WebhookLogStatus } from '../models/webhook-log.entity';
import { decrypt } from '@app/common/utils/crypting';
import { createHmac } from 'crypto';
import axios from 'axios';
import { concatenateObjectValues } from '../utils/object';
import {
  DOCUMENT_EXTRACTION_SERVICE,
  IDocumentExtractionService,
} from '../modules/document-extraction/document-extraction.interface';
import { Onchain, OnchainStatus } from '../models/onchain.entity';
import {
  CONSENSUS_MESSAGING_SERVICE,
  IConsensusMessagingService,
} from '../modules/consensus-messaging/consensus-messaging.interface';
import { PromptTemplate } from '../models/prompt-template.entity';
import { LLMServiceFactory } from '../modules/llm/llm.factory';
import { IOCRService, OCR_SERVICE } from '../modules/ocr/ocr.interface';
import { JobStatus } from '@aws-sdk/client-textract';

@Injectable()
export class DocumentManagementCronService
  implements IDocumentManagementCronService
{
  private readonly secretKey: string;
  private readonly logger = new Logger(DocumentManagementCronService.name);

  constructor(
    private entityManager: EntityManager,
    private readonly llmFactory: LLMServiceFactory,
    @Inject(DOCUMENT_EXTRACTION_SERVICE)
    private readonly documentExtractionService: IDocumentExtractionService,
    @Inject(CONSENSUS_MESSAGING_SERVICE)
    private readonly consensusMessagingService: IConsensusMessagingService,
    private readonly configService: ConfigService,
    @Inject(OCR_SERVICE) private readonly ocrService: IOCRService,
  ) {
    this.secretKey = this.configService.getOrThrow(
      'DOCUMENT_MANAGEMENT_SECRET_KEY',
    );
  }

  @Cron(HandlePendingOCRConfig.schedule, {
    disabled: HandlePendingOCRConfig.disabled,
  })
  async handlePendingOCRCron(): Promise<void> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const pendingOCR = await transactionalEntityManager.find(
          DocumentExtraction,
          {
            where: {
              status: DocumentExtractionStatus.PENDING_OCR,
            },
            lock: { mode: 'pessimistic_write' },
            order: {
              createdAt: 'ASC',
            },
          },
        );

        for (const doc of pendingOCR) {
          try {
            const { jobId } = doc;

            const { text, error, status, pages } =
              await this.ocrService.fetchOCR(jobId);

            if (error || status === JobStatus.FAILED) {
              doc.error = error;
              doc.status = DocumentExtractionStatus.FAILED;

              continue;
            }

            if (status === JobStatus.IN_PROGRESS) {
              continue;
            }

            doc.rawText = text;
            doc.pages = pages;
            doc.status = DocumentExtractionStatus.PENDING_LLM_EXTRACTION;

            await transactionalEntityManager.save(doc);
          } catch (e) {
            this.logger.error(
              `Exception caught in handlePendingOCRCron() for requestId: ${doc?.requestId}. Error: ${e}`,
            );

            doc.error = e;
            doc.status = DocumentExtractionStatus.FAILED;

            await transactionalEntityManager.save(doc);
          }
        }
      },
    );
  }

  @Cron(HandlePendingLLMExtractionConfig.schedule, {
    disabled: HandlePendingLLMExtractionConfig.disabled,
  })
  async handlePendingLLMExtractionCron(): Promise<void> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const pendingLLMExtractions = await transactionalEntityManager.find(
          DocumentExtraction,
          {
            where: {
              status: DocumentExtractionStatus.PENDING_LLM_EXTRACTION,
            },
            lock: { mode: 'pessimistic_write' },
            order: {
              createdAt: 'ASC',
            },
          },
        );

        for (const doc of pendingLLMExtractions) {
          try {
            const { rawText, templateId } = doc;

            const promptTemplate = await transactionalEntityManager.findOne(
              PromptTemplate,
              { where: { templateId } },
            );

            if (!promptTemplate) {
              doc.error = `No template found with the following id: ${templateId}`;
              doc.status = DocumentExtractionStatus.FAILED;

              await transactionalEntityManager.save(doc);

              continue;
            }

            const llmProvider = promptTemplate.llmProvider;

            const llmService = this.llmFactory.getService(llmProvider);
            const { extractedData, tokens } = await llmService.extractData(
              rawText,
              promptTemplate.prompt,
            );

            doc.tokens = tokens;
            doc.extractedData = extractedData;
            doc.status = DocumentExtractionStatus.PENDING_WEBHOOK;
            doc.llmProvider = llmProvider;

            await transactionalEntityManager.save(doc);
          } catch (e) {
            this.logger.error(
              `Exception caught in handlePendingLLMExtractionCron() for requestId: ${doc?.requestId}. Error: ${e}`,
            );

            doc.error = e;
            doc.status = DocumentExtractionStatus.FAILED;

            await transactionalEntityManager.save(doc);
          }
        }
      },
    );
  }

  @Cron(HandlePendingExtractionWebhookConfig.schedule, {
    disabled: HandlePendingExtractionWebhookConfig.disabled,
  })
  async handlePendingExtractionWebhookCron(): Promise<void> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const webhookEventType = WebhookEventType.EXTRACTION;
        const documentsPendingExtractionWebhook =
          await transactionalEntityManager.find(DocumentExtraction, {
            where: {
              status: DocumentExtractionStatus.PENDING_WEBHOOK,
            },
            lock: { mode: 'pessimistic_write' },
            order: {
              createdAt: 'ASC',
            },
          });

        for (const doc of documentsPendingExtractionWebhook) {
          const {
            refId,
            extractedData,
            documentType,
            isInternal,
            requestId,
            orgId,
            templateId,
            fileName,
          } = doc;

          if (isInternal) {
            await this.documentExtractionService.handleInternalExtractionCompletion(
              doc,
            );
            doc.status = DocumentExtractionStatus.COMPLETED;
            await transactionalEntityManager.save(doc);

            continue;
          }

          const webhooks = await transactionalEntityManager
            .getRepository(Webhook)
            .createQueryBuilder('webhook')
            .where('webhook.orgId = :orgId', { orgId })
            .andWhere(':eventType = ANY(webhook.eventTypes)', {
              eventType: webhookEventType,
            })
            .andWhere('webhook.isActive = :isActive', { isActive: true })
            .getMany();

          if (webhooks.length === 0) {
            continue;
          }

          let anySuccess = false;
          let anyFailure = false;

          for (const webhook of webhooks) {
            const { url, encryptedApiKey, encryptedSecretKey } = webhook;
            const decryptedApiKey = decrypt(encryptedApiKey, this.secretKey);
            const decryptedSecretKey = decrypt(
              encryptedSecretKey,
              this.secretKey,
            );

            const payload = {
              refId,
              documentType,
              templateId,
              fileName,
            };
            const concatenatedData = concatenateObjectValues(extractedData);
            const hmacSignature = createHmac('sha256', decryptedSecretKey)
              .update(concatenatedData)
              .digest('hex');

            const requestBody = {
              requestId,
              hmacSignature,
              data: extractedData,
              payload,
            };

            try {
              const response = await axios.post(url, requestBody, {
                headers: {
                  'api-key': decryptedApiKey,
                  'Content-Type': 'application/json',
                },
              });

              const newWebhookLog = new WebhookLog({
                url,
                requestBody,
                eventType: webhookEventType,
                status: WebhookLogStatus.SENT,
                responseStatus: response.status,
                responseBody: response.data,
                responseHeaders: response.headers,
                webhook,
                requestId,
              });

              await transactionalEntityManager.save(newWebhookLog);

              anySuccess = true;
            } catch (err) {
              this.logger.error(
                `Failed to POST to webhook ${url} for document extraction ${requestId}:`,
                err,
              );

              const errorWebhookLog = new WebhookLog({
                url,
                requestBody,
                eventType: webhookEventType,
                status: WebhookLogStatus.FAILED,
                webhook,
                responseStatus: err.response?.status,
                responseBody: err.response?.data,
                responseHeaders: err.response?.headers,
                errorMessage: err.message,
                requestId,
              });

              await transactionalEntityManager.save(errorWebhookLog);

              anyFailure = true;
            }

            if (anySuccess && anyFailure) {
              doc.status = DocumentExtractionStatus.PARTIAL_COMPLETED;
              doc.error = 'Some webhooks failed to deliver';
            } else if (anySuccess) {
              doc.status = DocumentExtractionStatus.COMPLETED;
            } else {
              doc.status = DocumentExtractionStatus.FAILED;
              doc.error = 'All webhooks failed to deliver';
            }

            await transactionalEntityManager.save(doc);
          }
        }
      },
    );
  }

  @Cron(HandlePendingConsensusMessagingWebhookConfig.schedule, {
    disabled: HandlePendingConsensusMessagingWebhookConfig.disabled,
  })
  async handlePendingConsensusMessagingWebhookCron(): Promise<void> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const webhookEventType = WebhookEventType.CONSENSUS_MESSAGING;
        const onchainPendingWebhook = await transactionalEntityManager.find(
          Onchain,
          {
            where: {
              status: OnchainStatus.PENDING_WEBHOOK,
            },
            lock: { mode: 'pessimistic_write' },
            order: {
              createdAt: 'ASC',
            },
          },
        );

        for (const onchain of onchainPendingWebhook) {
          const {
            refId,
            eventName,
            isInternal,
            requestId,
            transactionId,
            topicId,
            orgId,
            url: explorerUrl,
          } = onchain;

          if (isInternal) {
            await this.consensusMessagingService.handleInternalTopicMessageCompletion(
              onchain,
            );
            onchain.status = OnchainStatus.COMPLETED;
            await transactionalEntityManager.save(onchain);

            continue;
          }

          const webhooks = await transactionalEntityManager
            .getRepository(Webhook)
            .createQueryBuilder('webhook')
            .where('webhook.orgId = :orgId', { orgId })
            .andWhere(':eventType = ANY(webhook.eventTypes)', {
              eventType: webhookEventType,
            })
            .andWhere('webhook.isActive = :isActive', { isActive: true })
            .getMany();

          if (webhooks.length === 0) {
            continue;
          }

          let anySuccess = false;
          let anyFailure = false;

          for (const webhook of webhooks) {
            const { url, encryptedApiKey, encryptedSecretKey } = webhook;
            const decryptedApiKey = decrypt(encryptedApiKey, this.secretKey);
            const decryptedSecretKey = decrypt(
              encryptedSecretKey,
              this.secretKey,
            );

            const payload = {
              refId,
              eventName,
            };
            const data = {
              topicId,
              transactionId,
              url: explorerUrl,
            };
            const concatenatedData = concatenateObjectValues(data);
            const hmacSignature = createHmac('sha256', decryptedSecretKey)
              .update(concatenatedData)
              .digest('hex');

            const requestBody = {
              requestId,
              hmacSignature,
              data,
              payload,
            };

            try {
              const response = await axios.post(url, requestBody, {
                headers: {
                  'api-key': decryptedApiKey,
                  'Content-Type': 'application/json',
                },
              });

              const newWebhookLog = new WebhookLog({
                url,
                requestBody,
                eventType: webhookEventType,
                status: WebhookLogStatus.SENT,
                responseStatus: response.status,
                responseBody: response.data,
                responseHeaders: response.headers,
                webhook,
                requestId,
              });

              await transactionalEntityManager.save(newWebhookLog);

              anySuccess = true;
            } catch (err) {
              this.logger.error(
                `Failed to POST to webhook ${url} for onchain ${requestId}:`,
                err,
              );

              const errorWebhookLog = new WebhookLog({
                url,
                requestBody,
                eventType: webhookEventType,
                status: WebhookLogStatus.FAILED,
                webhook,
                responseStatus: err.response?.status,
                responseBody: err.response?.data,
                responseHeaders: err.response?.headers,
                errorMessage: err.message,
                requestId,
              });

              await transactionalEntityManager.save(errorWebhookLog);

              anyFailure = true;
            }

            if (anySuccess && anyFailure) {
              onchain.status = OnchainStatus.PARTIAL_COMPLETED;
              onchain.error = 'Some webhooks failed to deliver';
            } else if (anySuccess) {
              onchain.status = OnchainStatus.COMPLETED;
            } else {
              onchain.status = OnchainStatus.FAILED;
              onchain.error = 'All webhooks failed to deliver';
            }

            await transactionalEntityManager.save(onchain);
          }
        }
      },
    );
  }
}
