import { useMutation } from 'react-query';
import deleteTemplate from 'service/deleteTemplate';

const useDeleteTemplate = () => {
  return useMutation(['delete-template'], deleteTemplate);
};

export default useDeleteTemplate;
