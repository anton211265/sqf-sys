import { useMutation } from 'react-query';
import updateOnboardAt from 'service/updateOnboardAt';

const useUpdateOnboardAt = () => {
  return useMutation(['update-onboard-at'], updateOnboardAt);
};

export default useUpdateOnboardAt;
