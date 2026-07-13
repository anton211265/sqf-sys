import { useMutation } from 'react-query';
import updateWebhook from 'service/updateWebhook';

const useUpdateWebhook = () => {
  return useMutation(['update-webhook'], updateWebhook);
};

export default useUpdateWebhook;
