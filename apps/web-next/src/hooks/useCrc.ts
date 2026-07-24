import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/crc';
import { SaveModelInput } from 'types/CrcTypes';

export const useRiskModels = (status?: string, enabled = true) =>
  useQuery({
    queryKey: ['crc', 'models', status ?? 'all'],
    queryFn: () => api.getRiskModels(status),
    enabled,
  });

export const useRiskModel = (id: number | null) =>
  useQuery({
    queryKey: ['crc', 'model', id],
    queryFn: () => api.getRiskModel(id as number),
    enabled: id !== null,
  });

export const useAssessments = (organizationId?: number) =>
  useQuery({
    queryKey: ['crc', 'assessments', organizationId ?? 'all'],
    queryFn: () => api.getAssessments(organizationId),
  });

export const useAssessment = (id: number | null) =>
  useQuery({
    queryKey: ['crc', 'assessment', id],
    queryFn: () => api.getAssessment(id as number),
    enabled: id !== null,
  });

const useInvalidateCrc = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['crc'] });
};

export const useCreateRiskModel = () => {
  const invalidate = useInvalidateCrc();
  return useMutation({ mutationFn: api.createRiskModel, onSuccess: invalidate });
};

export const useUpdateRiskModel = () => {
  const invalidate = useInvalidateCrc();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: SaveModelInput }) =>
      api.updateRiskModel(id, input),
    onSuccess: invalidate,
  });
};

type LifecycleVars = { id: number; note?: string };

export const useModelLifecycleAction = () => {
  const invalidate = useInvalidateCrc();
  return useMutation({
    mutationFn: ({ action, id, note }: LifecycleVars & {
      action: 'submit' | 'check' | 'return' | 'reject' | 'publish' | 'archive';
    }) => {
      switch (action) {
        case 'submit':
          return api.submitRiskModel(id);
        case 'check':
          return api.checkRiskModel(id);
        case 'return':
          return api.returnRiskModel(id, note);
        case 'reject':
          return api.rejectRiskModel(id, note);
        case 'publish':
          return api.publishRiskModel(id);
        case 'archive':
          return api.archiveRiskModel(id);
        default:
          return Promise.reject(new Error('unknown action'));
      }
    },
    onSuccess: invalidate,
  });
};

export const useConductAssessment = () => {
  const invalidate = useInvalidateCrc();
  return useMutation({ mutationFn: api.conductAssessment, onSuccess: invalidate });
};
