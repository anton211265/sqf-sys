import { useQuery } from 'react-query';
import getWebhookDetails from 'service/getWebhookDetails';

function useGetWebhookDetails(webhookId: string) {
  return useQuery(
    ['get-webhook-details', webhookId],
    () => getWebhookDetails({ webhookId }),
    {
      retry: false,
    }
  );
}

export default useGetWebhookDetails;
