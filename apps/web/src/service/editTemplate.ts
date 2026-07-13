import { LLMProvider, WebhookEventType } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';
import { Prompt } from './createTemplate';

export interface IEditTemplateRequest {
  templateId: string;
  name: string;
  llmProvider: LLMProvider;
  prompt: Prompt[];
}

interface IEditTemplateResponse {
  message: string;
}

const editTemplate = async (
  body: IEditTemplateRequest
): Promise<IEditTemplateResponse> => {
  const { name, llmProvider, prompt, templateId } = body;

  try {
    const response = await apiClient.post(
      `/document-management/extraction/template/${templateId}`,
      { name, llmProvider, prompt },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default editTemplate;
