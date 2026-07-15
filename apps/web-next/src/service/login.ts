import axiosClient, { setAccessToken } from 'api/axiosClient';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

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
    const response = await axiosClient().post(
      '/trade-directory/auth/login',
      loginData,
      { headers: { 'Content-Type': 'application/json' } },
    );

    // Refresh token is set as httpOnly cookie by the server — not in response body.
    setAccessToken(response.data.accessToken);

    return response.data;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

export default login;
