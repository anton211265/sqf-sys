import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';

interface IDownloadExtractionDocumentRequest {
  requestId: string;
}

const downloadExtractionDocument = async (
  param: IDownloadExtractionDocumentRequest
) => {
  try {
    const response = await apiClient.post(
      `/document-management/extraction/document/${param.requestId}`,
      {},
      { headers: { 'Content-Type': 'application/json' }, responseType: 'blob' }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default downloadExtractionDocument;
