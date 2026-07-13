import { getToken } from 'utils/cookie';
import { Token } from 'constants/enum';
import { useQuery } from 'react-query';
import getLogInPersonDetail from 'service/getLogInPersonDetail';

function useGetLogInPersonDetail() {
  return useQuery(['get-log-in-person-detail'], () => getLogInPersonDetail(), {
    retry: false,
    enabled: !!getToken(Token.AccessToken),
  });
}

export default useGetLogInPersonDetail;
