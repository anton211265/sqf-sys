import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

const getLogInPersonDetail = async () => {
  try {
    const response = await apiClient.get(`/trade-directory/api/person/me`);

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default getLogInPersonDetail;
