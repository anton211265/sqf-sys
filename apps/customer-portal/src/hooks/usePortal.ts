import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/portal';

export const useOnboardingConfig = () =>
  useQuery({
    queryKey: ['portal', 'onboarding-config'],
    queryFn: api.getOnboardingConfig,
    staleTime: 60_000,
  });

export const useApplication = () =>
  useQuery({ queryKey: ['portal', 'application'], queryFn: api.getApplication });

const useInvalidatePortal = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['portal', 'application'] });
};

export const useSaveApplication = () => {
  const invalidate = useInvalidatePortal();
  return useMutation({ mutationFn: api.saveApplication, onSuccess: invalidate });
};

export const useSubmitApplication = () => {
  const invalidate = useInvalidatePortal();
  return useMutation({ mutationFn: api.submitApplication, onSuccess: invalidate });
};

export const useRegister = () => useMutation({ mutationFn: api.register });
