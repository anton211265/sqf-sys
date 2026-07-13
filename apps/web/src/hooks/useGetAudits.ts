import { useQuery } from 'react-query';
import getAudits from 'service/getAudits';

function useGetAudits(status: string) {
  return useQuery(['get-audits', status], () => getAudits({ status }), {
    retry: false,
  });
}

export default useGetAudits;
