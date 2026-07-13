import { WebhookEventType } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface ICreateWebhookRequest {
  name: string;
  url: string;
  apiKey: string;
  secretKey: string;
  eventTypes: WebhookEventType[];
}

interface ICreateWebhookResponse {
  message: string;
}

const createWebhook = async (
  body: ICreateWebhookRequest
): Promise<ICreateWebhookResponse> => {
  try {
    const response = await apiClient.post(
      '/document-management/webhook',
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default createWebhook;
