import { useQuery } from 'react-query';
import getWebhooks from 'service/getWebhooks';

function useGetWebhooks() {
  return useQuery(['get-webhooks'], () => getWebhooks(), {
    retry: false,
  });
}

export default useGetWebhooks;
