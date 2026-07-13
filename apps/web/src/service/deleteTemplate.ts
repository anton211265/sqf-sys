import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface ITemplateRequest {
  id: string;
}

interface ITemplateResponse {
  message: string;
}

const deleteApiKey = async ({
  id,
}: ITemplateRequest): Promise<ITemplateResponse> => {
  try {
    const response = await apiClient.delete(
      `/document-management/extraction/template/${id}`
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default deleteApiKey;
