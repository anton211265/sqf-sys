import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IGenerateApiKeyRequest {
  name: string;
}

interface IGenerateApiKeyResponse {
  message: string;
}

const generateApiKey = async ({
  name,
}: IGenerateApiKeyRequest): Promise<IGenerateApiKeyResponse> => {
  try {
    const response = await apiClient.post(
      '/document-management/api-key',
      { name },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default generateApiKey;
