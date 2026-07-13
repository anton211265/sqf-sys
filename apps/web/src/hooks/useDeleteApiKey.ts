import { useMutation } from 'react-query';
import deleteApiKey from 'service/deleteApiKey';

const useDeleteApiKey = () => {
  return useMutation(['delete-api-key'], deleteApiKey);
};

export default useDeleteApiKey;
