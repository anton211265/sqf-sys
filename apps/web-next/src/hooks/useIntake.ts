import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/intake';

export const useIntakeApplications = (bucket?: 'crc') =>
  useQuery({
    queryKey: ['intake', 'applications', bucket ?? 'all'],
    queryFn: () => api.getIntakeApplications(bucket),
  });

export const useWebApplicants = (enabled = true) =>
  useQuery({
    queryKey: ['intake', 'web-applicants'],
    queryFn: api.getWebApplicants,
    enabled,
  });

const useInvalidateIntake = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['intake'] });
};

export const useOverrideIntakePass = () => {
  const invalidate = useInvalidateIntake();
  return useMutation({ mutationFn: api.overrideIntakePass, onSuccess: invalidate });
};

export const useAssignWebApplicant = () => {
  const invalidate = useInvalidateIntake();
  return useMutation({
    mutationFn: ({ id, rmPersonId }: { id: number; rmPersonId: number }) =>
      api.assignWebApplicant(id, rmPersonId),
    onSuccess: invalidate,
  });
};
