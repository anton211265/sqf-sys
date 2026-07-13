import { useMutation } from 'react-query';
import uploadExtraction from 'service/uploadExtraction';

const useUploadExtraction = () => {
  return useMutation(['upload-extraction'], uploadExtraction);
};

export default useUploadExtraction;
