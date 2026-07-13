import { useQuery } from 'react-query';
import getExtractions from 'service/getExtractions';

function useGetExtractions(status: string) {
  return useQuery(
    ['get-extractions', status],
    () => getExtractions({ status }),
    {
      retry: false,
    }
  );
}

export default useGetExtractions;
