import { LLMProvider, WebhookEventType } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface Prompt {
  format: string;
  keyToExtract: string;
  description: string;
}

export interface ICreateTemplateRequest {
  name: string;
  llmProvider: LLMProvider;
  prompt: Prompt[];
}

interface ICreateTemplateResponse {
  message: string;
}

const createTemplate = async (
  body: ICreateTemplateRequest
): Promise<ICreateTemplateResponse> => {
  try {
    const response = await apiClient.post(
      '/document-management/extraction/template',
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default createTemplate;
