import { useQuery } from 'react-query';
import getApiKeys from 'service/getApiKeys';

function useGetApiKeys() {
  return useQuery(['get-api-keys'], () => getApiKeys(), {
    retry: false,
  });
}

export default useGetApiKeys;
