import { useMutation } from 'react-query';
import downloadExtractionDocument from 'service/downloadExtractionDocument';

const useDownloadExtractionDocument = () => {
  return useMutation(
    ['download-extraction-document'],
    downloadExtractionDocument
  );
};

export default useDownloadExtractionDocument;
