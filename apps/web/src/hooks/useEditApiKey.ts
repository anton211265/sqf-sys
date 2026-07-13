import { useMutation } from 'react-query';
import editApiKey from 'service/editApiKey';

const useEditApiKey = () => {
  return useMutation(['edit-api-key'], editApiKey);
};

export default useEditApiKey;
