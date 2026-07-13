import { useMutation } from 'react-query';
import login from 'service/login';

const useLogin = () => {
  return useMutation(['login'], login);
};

export default useLogin;
