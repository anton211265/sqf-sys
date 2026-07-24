import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/configurator';
import { RateCardInput } from 'types/ConfiguratorTypes';

export const useConfigProducts = () =>
  useQuery({ queryKey: ['config', 'products'], queryFn: api.getProducts });

export const useRateCards = (productId: number | null) =>
  useQuery({
    queryKey: ['config', 'rate-cards', productId],
    queryFn: () => api.getRateCards(productId as number),
    enabled: productId !== null,
  });

export const useTemplates = () =>
  useQuery({ queryKey: ['config', 'templates'], queryFn: api.getTemplates });

export const useProductTemplates = (productId: number | null) =>
  useQuery({
    queryKey: ['config', 'product-templates', productId],
    queryFn: () => api.getProductTemplates(productId as number),
    enabled: productId !== null,
  });

export const useAssignments = () =>
  useQuery({ queryKey: ['config', 'assignments'], queryFn: () => api.getAssignments() });

export const useConfigAudit = (limit = 100) =>
  useQuery({
    queryKey: ['config', 'audit', limit],
    queryFn: () => api.getConfigAudit(limit),
  });

const useInvalidate = () => {
  const client = useQueryClient();
  return (...keys: string[]) =>
    Promise.all(
      keys.map((key) => client.invalidateQueries({ queryKey: ['config', key] })),
    );
};

export const useCreateProduct = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => invalidate('products', 'audit'),
  });
};

export const useUpdateProduct = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; productName?: string; description?: string; isActive?: boolean; changeReason?: string }) =>
      api.updateProduct(id, input),
    onSuccess: () => invalidate('products', 'audit'),
  });
};

export const useCreateBespoke = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.createBespokeProduct,
    onSuccess: () => invalidate('products', 'rate-cards', 'audit'),
  });
};

export const useCreateDraft = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ productId, ...input }: RateCardInput & { productId: number }) =>
      api.createRateCardDraft(productId, input),
    onSuccess: () => invalidate('rate-cards', 'audit'),
  });
};

export const useUpdateDraft = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: RateCardInput & { id: number }) =>
      api.updateRateCardDraft(id, input),
    onSuccess: () => invalidate('rate-cards', 'audit'),
  });
};

export const usePublishRateCard = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.publishRateCard,
    onSuccess: () => invalidate('rate-cards', 'products', 'audit'),
  });
};

export const useCreateTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.createTemplate,
    onSuccess: () => invalidate('templates', 'audit'),
  });
};

export const useBindTemplates = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ productId, templateIds }: { productId: number; templateIds: number[] }) =>
      api.bindProductTemplates(productId, templateIds),
    onSuccess: () => invalidate('product-templates', 'audit'),
  });
};

export const useCreateAssignment = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: api.createAssignment,
    onSuccess: () => invalidate('assignments', 'audit'),
  });
};

// ---- Billing / Calendar / Policies ----

export const useBilling = () =>
  useQuery({ queryKey: ['config', 'billing'], queryFn: api.getBilling });

export const useCalendar = () =>
  useQuery({ queryKey: ['config', 'calendar'], queryFn: api.getCalendar });

export const usePolicies = () =>
  useQuery({ queryKey: ['config', 'policies'], queryFn: api.getPolicies });

const configMutation = <TInput,>(
  fn: (input: TInput) => Promise<unknown>,
  key: 'billing' | 'calendar' | 'policies',
) =>
  function useConfigMutation() {
    const invalidate = useInvalidate();
    return useMutation({
      mutationFn: fn,
      onSuccess: () => invalidate(key, 'audit'),
    });
  };

export const useUpsertRateIndex = configMutation(api.upsertRateIndex, 'billing');
export const useDeleteRateIndex = configMutation(api.deleteRateIndex, 'billing');
export const useUpsertFee = configMutation(api.upsertFee, 'billing');
export const useDeleteFee = configMutation(api.deleteFee, 'billing');
export const usePatchBillingSettings = configMutation(api.patchBillingSettings, 'billing');

export const useUpsertCalendarDay = configMutation(api.upsertCalendarDay, 'calendar');
export const useDeleteCalendarDay = configMutation(api.deleteCalendarDay, 'calendar');
export const usePatchCalendarSettings = configMutation(api.patchCalendarSettings, 'calendar');

export const useUpsertSla = configMutation(api.upsertSla, 'policies');
export const useDeleteSla = configMutation(api.deleteSla, 'policies');
export const useUpsertApprovalRule = configMutation(api.upsertApprovalRule, 'policies');
export const useDeleteApprovalRule = configMutation(api.deleteApprovalRule, 'policies');
export const useUpsertCreditRange = configMutation(api.upsertCreditRange, 'policies');
export const useDeleteCreditRange = configMutation(api.deleteCreditRange, 'policies');
export const usePatchPolicySettings = configMutation(api.patchPolicySettings, 'policies');

// ---- SLA firing engine ----

export const useSlaTimers = () =>
  useQuery({
    queryKey: ['config', 'sla-timers'],
    queryFn: () => api.getSlaTimers(),
    refetchInterval: 15_000, // live monitor — the breach cron runs every 30s
  });

export const useResolveSlaTimer = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      api.resolveSlaTimer(id, reason),
    onSuccess: () => invalidate('sla-timers'),
  });
};
