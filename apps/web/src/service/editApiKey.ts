import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface IEditApiKeyRequest {
  name: string;
  id: number;
}

interface IEditApiKeyResponse {
  message: string;
}

const editApiKey = async (
  body: IEditApiKeyRequest
): Promise<IEditApiKeyResponse> => {
  const { name, id } = body;

  try {
    const response = await apiClient.post(
      `/document-management/api-key/${id}`,
      { name },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default editApiKey;
