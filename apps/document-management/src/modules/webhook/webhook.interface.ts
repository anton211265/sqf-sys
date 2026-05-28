import { CreateWebhookDto } from './dto/request/create-webhook.dto';
import { UpdateWebhookDto } from './dto/request/update-webhook.dto';
import { CreateWebhookResponseDto } from './dto/response/create-webhook-response.dto';
import { GetWebhookResponseDto } from './dto/response/get-webhook-response.dto';
import { GetWebhooksResponseDto } from './dto/response/get-webhooks-response.dto';
import { UpdateWebhookResponseDto } from './dto/response/update-webhook-response.dto';

export const WEBHOOK_SERVICE = 'WEBHOOK SERVICE';

export interface IWebhookService {
  /**
   * get all webhooks
   * @param orgId
   */
  getWebhooks(orgId: number): Promise<GetWebhooksResponseDto[]>;

  /**
   * create a webhook
   * @param orgId
   * @param data
   */
  createWebhook(
    orgId: number,
    data: CreateWebhookDto,
  ): Promise<CreateWebhookResponseDto>;

  /**
   * update a webhook
   * @param orgId
   * @param id
   * @param data
   */
  updateWebhook(
    orgId: number,
    id: string,
    data: UpdateWebhookDto,
  ): Promise<UpdateWebhookResponseDto>;

  /**
   * get details about a single webhook
   * @param orgId
   * @param id
   */
  getWebhook(orgId: number, id: string): Promise<GetWebhookResponseDto>;
}
