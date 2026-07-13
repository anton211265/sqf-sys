import { useMutation } from 'react-query';
import createMessage from 'service/createMessage';

const useCreateMessage = () => {
  return useMutation(['create-message'], createMessage);
};

export default useCreateMessage;
