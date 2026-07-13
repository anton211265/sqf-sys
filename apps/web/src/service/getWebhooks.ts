import { WebhookEventType } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface IGetWebhooksResponse {
  webhookId: string;
  name: string;
  url: string;
  isActive: boolean;
  createdAt: string;
  eventTypes: WebhookEventType[];
}

const getWebhooks = async (): Promise<IGetWebhooksResponse[]> => {
  try {
    const response = await apiClient.get('/document-management/webhook');

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getWebhooks;
