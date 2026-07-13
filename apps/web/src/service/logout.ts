import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { setAccessToken } from '../api/axiosClient';
import { publicClient } from 'utils/reactQuery';

interface ILogoutResponse {
  message: string;
}

const logout = async (): Promise<ILogoutResponse> => {
  try {
    // No body needed — server reads refresh token from httpOnly cookie and clears it.
    const response = await publicClient.post(
      '/trade-directory/auth/logout',
      {},
      { headers: { 'Content-Type': 'application/json' } },
    );

    setAccessToken(null);

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);
    throw new Error(message);
  }
};

export default logout;
