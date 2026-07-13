import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IDeleteApiKeyRequest {
  id: number;
}

interface IDeleteApiKeyResponse {
  message: string;
}

const deleteApiKey = async ({
  id,
}: IDeleteApiKeyRequest): Promise<IDeleteApiKeyResponse> => {
  try {
    const response = await apiClient.delete(
      `/document-management/api-key/${id}`
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default deleteApiKey;
