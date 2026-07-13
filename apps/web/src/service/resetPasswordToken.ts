import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { publicClient } from 'utils/reactQuery';

interface IResetPasswordTokenRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

const resetPasswordToken = async (
  resetPasswordTokenData: IResetPasswordTokenRequest
) => {
  try {
    const response = await publicClient.post(
      '/trade-directory/auth/reset',
      resetPasswordTokenData,
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default resetPasswordToken;
