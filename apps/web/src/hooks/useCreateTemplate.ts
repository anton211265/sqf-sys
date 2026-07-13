import { useMutation } from 'react-query';
import createTemplate from 'service/createTemplate';

const useCreateTemplate = () => {
  return useMutation(['create-template'], createTemplate);
};

export default useCreateTemplate;
