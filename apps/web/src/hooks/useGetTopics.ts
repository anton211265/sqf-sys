import { useQuery } from 'react-query';
import getTopics from 'service/getTopics';

function useGetTopics() {
  return useQuery(['get-topics'], () => getTopics(), {
    retry: false,
  });
}

export default useGetTopics;
