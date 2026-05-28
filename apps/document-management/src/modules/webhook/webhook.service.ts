import { BadRequestException, Injectable } from '@nestjs/common';
import { IWebhookService } from './webhook.interface';
import { WebhookRepository } from '../../repositories/webhook.repository';
import { ConfigService } from '@nestjs/config';
import { GetWebhooksResponseDto } from './dto/response/get-webhooks-response.dto';
import { decrypt, encrypt } from '@app/common/utils/crypting';
import { CreateWebhookDto } from './dto/request/create-webhook.dto';
import { CreateWebhookResponseDto } from './dto/response/create-webhook-response.dto';
import { Webhook } from '../../models/webhook.entity';
import { UpdateWebhookDto } from './dto/request/update-webhook.dto';
import { UpdateWebhookResponseDto } from './dto/response/update-webhook-response.dto';
import { GetWebhookResponseDto } from './dto/response/get-webhook-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebhookService implements IWebhookService {
  private readonly secretKey: string;

  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly configService: ConfigService,
  ) {
    this.secretKey = this.configService.getOrThrow(
      'DOCUMENT_MANAGEMENT_SECRET_KEY',
    );
  }

  async getWebhooks(orgId: number): Promise<GetWebhooksResponseDto[]> {
    const webhooks = await this.webhookRepository.find({
      where: { orgId: orgId.toString() },
      order: { createdAt: 'DESC' },
    });
    const response: GetWebhooksResponseDto[] = [];

    for (const webhook of webhooks) {
      const { name, url, createdAt, isActive, webhookId, eventTypes } = webhook;

      const entry: GetWebhooksResponseDto = {
        webhookId,
        name,
        url,
        createdAt,
        isActive,
        eventTypes,
      };

      response.push(entry);
    }

    return response;
  }

  async createWebhook(
    orgId: number,
    data: CreateWebhookDto,
  ): Promise<CreateWebhookResponseDto> {
    const { name, url, apiKey, secretKey, eventTypes } = data;
    const webhookId = uuidv4();
    const encryptedApiKey = encrypt(apiKey, this.secretKey);
    const encryptedSecretKey = encrypt(secretKey, this.secretKey);

    const newWebhook = new Webhook({
      webhookId,
      name,
      url,
      encryptedApiKey,
      encryptedSecretKey,
      eventTypes,
      orgId: orgId.toString(),
    });

    await this.webhookRepository.save(newWebhook);

    return { message: 'success' };
  }

  async updateWebhook(
    orgId: number,
    id: string,
    data: UpdateWebhookDto,
  ): Promise<UpdateWebhookResponseDto> {
    const { name, url, apiKey, secretKey, isActive, eventTypes } = data;
    const webhook = await this.webhookRepository.findOne({
      where: { webhookId: id, orgId: orgId.toString() },
    });

    if (!webhook) {
      throw new BadRequestException(`Webhook with id: ${id} does not exist`);
    }

    const encryptedApiKey = encrypt(apiKey, this.secretKey);
    const encryptedSecretKey = encrypt(secretKey, this.secretKey);

    webhook.name = name;
    webhook.url = url;
    webhook.encryptedApiKey = encryptedApiKey;
    webhook.encryptedSecretKey = encryptedSecretKey;
    webhook.isActive = isActive;
    webhook.eventTypes = eventTypes;

    await this.webhookRepository.save(webhook);

    return { message: 'success' };
  }

  async getWebhook(orgId: number, id: string): Promise<GetWebhookResponseDto> {
    const webhook = await this.webhookRepository.findOne({
      where: { orgId: orgId.toString(), webhookId: id },
      relations: ['logs'],
    });

    if (!webhook) {
      throw new BadRequestException(`Webhook with id: ${id} does not exist`);
    }

    webhook.logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const {
      name,
      url,
      encryptedApiKey,
      encryptedSecretKey,
      createdAt,
      isActive,
      logs,
      eventTypes,
    } = webhook;

    const decryptedApiKey = decrypt(encryptedApiKey, this.secretKey);
    const decryptedSecretKey = decrypt(encryptedSecretKey, this.secretKey);

    const response: GetWebhookResponseDto = {
      eventTypes,
      name,
      url,
      apiKey: decryptedApiKey,
      secretKey: decryptedSecretKey,
      createdAt,
      isActive,
      logs,
    };

    return response;
  }
}
