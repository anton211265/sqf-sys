import { OnchainStatus } from 'constants/enum';
import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IGetAuditsRequest {
  status?: string;
}

export interface IGetAuditsResponse {
  requestId: string;
  refId: string;
  status: OnchainStatus;
  topicId: boolean;
  transactionId: string;
  url: string;
  eventName: string;
  error?: string;
  createdAt: string;
}

const getAudits = async ({
  status,
}: IGetAuditsRequest): Promise<IGetAuditsResponse[]> => {
  try {
    let url = '/document-management/consensus-messaging/message';

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

export default getAudits;
