import { WebhookEventType } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface IUpdateWebhookRequest {
  webhookId: string;
  name: string;
  url: string;
  apiKey: string;
  secretKey: string;
  eventTypes: WebhookEventType[];
  isActive: boolean;
}

interface IUpdateWebhookResponse {
  message: string;
}

const updateWebhook = async (
  request: IUpdateWebhookRequest
): Promise<IUpdateWebhookResponse> => {
  try {
    const { webhookId, ...body } = request;
    const response = await apiClient.post(
      `/document-management/webhook/${webhookId}`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default updateWebhook;
