import { getApiResponseErrorMsg } from 'utils/apiHelper';
import { apiClient } from 'utils/reactQuery';
import FormData from 'form-data';

export interface IUploadExtractionRequest {
  refId: string;
  documentType: string;
  templateId: string;
  file: File;
}

interface IUploadExtractionResponse {
  message: string;
}

const createTemplate = async (
  body: IUploadExtractionRequest
): Promise<IUploadExtractionResponse> => {
  try {
    const formData = new FormData();
    formData.append('refId', body.refId);
    formData.append('documentType', body.documentType);
    formData.append('templateId', body.templateId);
    formData.append('file', body.file);

    const response = await apiClient.post(
      '/document-management/extraction/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );

    return response.data;
  } catch (e) {
    const message = getApiResponseErrorMsg(e);

    throw new Error(message);
  }
};

export default createTemplate;
