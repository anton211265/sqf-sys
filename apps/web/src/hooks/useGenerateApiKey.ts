import { useMutation } from 'react-query';
import generateApiKey from 'service/generateApiKey';

const useGenerateApiKey = () => {
  return useMutation(['generate-api-key'], generateApiKey);
};

export default useGenerateApiKey;
