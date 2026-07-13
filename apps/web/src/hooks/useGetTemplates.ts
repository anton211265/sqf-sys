import { useQuery } from 'react-query';
import getTemplates from 'service/getTemplates';

function useGetTemplates() {
  return useQuery(['get-templates'], () => getTemplates(), {
    retry: false,
  });
}

export default useGetTemplates;
