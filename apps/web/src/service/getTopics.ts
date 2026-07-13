import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

const getTopics = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get(
      '/document-management/consensus-messaging/topic'
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getTopics;
