import { useMutation } from 'react-query';
import resetPasswordToken from 'service/resetPasswordToken';

const useResetPasswordToken = () => {
  return useMutation(['reset-password-token'], resetPasswordToken);
};

export default useResetPasswordToken;
