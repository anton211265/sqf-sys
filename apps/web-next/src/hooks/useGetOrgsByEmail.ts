import { useMutation } from '@tanstack/react-query';
import getOrgsByEmail from 'service/getOrgsByEmail';

const useGetOrgsByEmail = () =>
  useMutation({ mutationKey: ['get-orgs-by-email'], mutationFn: getOrgsByEmail });

export default useGetOrgsByEmail;
