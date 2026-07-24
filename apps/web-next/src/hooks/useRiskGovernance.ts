import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configurator from 'service/configurator';
import * as api from 'service/riskGovernance';

export const useRiskProfiles = () =>
  useQuery({ queryKey: ['risk', 'profiles'], queryFn: api.getRiskProfiles });

export const useChangeRequests = () =>
  useQuery({
    queryKey: ['risk', 'change-requests'],
    queryFn: () => api.getChangeRequests(),
  });

const useInvalidateRisk = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['risk'] });
};

export const useCreateChangeRequest = () => {
  const invalidate = useInvalidateRisk();
  return useMutation({
    mutationFn: api.createChangeRequest,
    onSuccess: invalidate,
  });
};

export const useApproveChangeRequest = () => {
  const invalidate = useInvalidateRisk();
  return useMutation({
    mutationFn: api.approveChangeRequest,
    onSuccess: invalidate,
  });
};

export const useRejectChangeRequest = () => {
  const invalidate = useInvalidateRisk();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      api.rejectChangeRequest(id, note),
    onSuccess: invalidate,
  });
};

export const useProductRiskFilters = (productIds: number[]) =>
  useQuery({
    queryKey: ['risk', 'product-filters', productIds.join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        productIds.map(async (id) => [id, (await configurator.getProductRiskFilter(id)).riskProfileCode] as const),
      );
      return Object.fromEntries(entries) as Record<number, string | null>;
    },
    enabled: productIds.length > 0,
  });

export const useAssignProductRiskFilter = () => {
  const invalidate = useInvalidateRisk();
  return useMutation({
    mutationFn: ({ productId, riskProfileCode }: { productId: number; riskProfileCode: string | null }) =>
      configurator.assignProductRiskFilter(productId, riskProfileCode),
    onSuccess: invalidate,
  });
};
