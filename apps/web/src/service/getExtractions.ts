import { DocumentExtractionStatus } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IGetExtractionsRequest {
  status?: string;
}

export interface IGetExtractionsResponse {
  requestId: string;
  refId: string;
  status: DocumentExtractionStatus;
  templateId: string;
  documentType: string;
  fileName: string;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extractedData?: Record<string, any>;
  llmProvider?: string;
  tokens?: number;
  pages?: number;
  createdAt: string;
}

const getExtractions = async ({
  status,
}: IGetExtractionsRequest): Promise<IGetExtractionsResponse[]> => {
  try {
    let url = '/document-management/extraction/document';

    if (status) {
      url = `${url}?status=${status}`;
    }

    const response = await apiClient.get(url);

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getExtractions;
