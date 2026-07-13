/* eslint-disable @typescript-eslint/no-explicit-any */
import { WebhookEventType, WebhookLogStatus } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface IGetWebhookDetailsRequest {
  webhookId: string;
}

export interface IWebhookLog {
  requestBody: Record<string, any>;
  eventType: WebhookEventType;
  url: string;
  createdAt: string;
  status: WebhookLogStatus;
  responseStatus?: number;
  responseBody?: any;
  responseHeaders?: Record<string, any>;
  errorMessage?: string;
  requestId: string;
}

export interface IGetWebhookDetailsResponse {
  name: string;
  url: string;
  apiKey: string;
  secretKey: string;
  createdAt: string;
  isActive: boolean;
  logs: IWebhookLog[];
  eventTypes: WebhookEventType[];
}

const getWebhooks = async ({
  webhookId,
}: IGetWebhookDetailsRequest): Promise<IGetWebhookDetailsResponse> => {
  try {
    const response = await apiClient.get(
      `/document-management/webhook/${webhookId}`
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getWebhooks;
