import { useMutation } from 'react-query';
import editTemplate from 'service/editTemplate';

const useEditTemplate = () => {
  return useMutation(['edit-template'], editTemplate);
};

export default useEditTemplate;
