import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IAttibutes {
  dataType: string;
  hash: string;
}

interface ICreateMessageRequest {
  topicId?: string;
  refId: string;
  eventName: string;
  attributes: IAttibutes[];
}

interface ICreateMessageResponse {
  requestId: string;
}

const createMessage = async (
  data: ICreateMessageRequest
): Promise<ICreateMessageResponse> => {
  try {
    const { refId, topicId, eventName, attributes } = data;
    const body: ICreateMessageRequest = {
      refId,
      eventName,
      attributes,
    };

    if (topicId) {
      body.topicId = topicId;
    }

    const response = await apiClient.post(
      '/document-management/consensus-messaging/message',
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default createMessage;
