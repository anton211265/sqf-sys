import { useMutation } from 'react-query';
import logout from 'service/logout';

const useLogout = () => {
  return useMutation(['logout'], logout);
};

export default useLogout;
