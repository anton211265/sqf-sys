import { useMutation } from 'react-query';
import getOrgsByEmail from 'service/getOrgsByEmail';

const useGetOrgsByEmail = () => {
  return useMutation(['get-orgs-by-email'], getOrgsByEmail);
};

export default useGetOrgsByEmail;
