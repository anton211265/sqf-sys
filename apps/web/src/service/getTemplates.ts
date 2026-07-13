import { LLMProvider } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';
import { Prompt } from './createTemplate';

export interface IGetTemplatesResponse {
  name: string;
  templateId: string;
  llmProvider: LLMProvider;
  numberOfPrompts: number;
  createdAt: string;
  prompt: Prompt[];
}

const getTemplates = async (): Promise<IGetTemplatesResponse[]> => {
  try {
    const response = await apiClient.get(
      '/document-management/extraction/template'
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getTemplates;
