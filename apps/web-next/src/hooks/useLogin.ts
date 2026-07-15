import { useMutation } from '@tanstack/react-query';
import login from 'service/login';

const useLogin = () => useMutation({ mutationKey: ['login'], mutationFn: login });

export default useLogin;
