import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

export interface IGetApiKeysResponse {
  id: number;
  name: string;
  key: string;
  createdAt: string;
}

const getApiKeys = async (): Promise<IGetApiKeysResponse[]> => {
  try {
    const response = await apiClient.get('/document-management/api-key');

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getApiKeys;
