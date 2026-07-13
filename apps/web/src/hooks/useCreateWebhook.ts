import { useMutation } from 'react-query';
import createWebhook from 'service/createWebhook';

const useCreateWebhook = () => {
  return useMutation(['create-webhook'], createWebhook);
};

export default useCreateWebhook;
