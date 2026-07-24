import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from 'api/axiosClient';
import getLogInPersonDetail from 'service/getLogInPersonDetail';

const useGetLogInPersonDetail = () =>
  useQuery({
    queryKey: ['get-log-in-person-detail'],
    queryFn: getLogInPersonDetail,
    retry: false,
    enabled: !!getAccessToken(),
  });

export default useGetLogInPersonDetail;
