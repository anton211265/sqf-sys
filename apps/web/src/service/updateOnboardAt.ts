import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IUpdateOnboardAtRequest {
  onboardAt: string;
}
const updateOnboardAt = async (body: IUpdateOnboardAtRequest) => {
  try {
    const response = await apiClient.post(
      `/trade-directory/api/organizations/fully-onboarded`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default updateOnboardAt;
