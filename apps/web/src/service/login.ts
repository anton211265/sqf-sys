import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { setAccessToken } from '../api/axiosClient';
import { publicClient } from 'utils/reactQuery';

interface ILoginRequest {
  email: string;
  password: string;
  orgId: number;
}

interface ILoginResponse {
  accessToken: string;
}

const login = async (loginData: ILoginRequest): Promise<ILoginResponse> => {
  try {
    const response = await publicClient.post(
      '/trade-directory/auth/login',
      loginData,
      { headers: { 'Content-Type': 'application/json' } },
    );

    // Refresh token is set as httpOnly cookie by the server — not in response body.
    setAccessToken(response.data.accessToken);

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);
    throw new Error(message);
  }
};

export default login;
