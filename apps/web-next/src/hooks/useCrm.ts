import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/crm';

export const useLeads = (scope?: 'team') =>
  useQuery({ queryKey: ['crm', 'leads', scope ?? 'mine'], queryFn: () => api.getLeads(scope) });

export const useDeals = (scope?: 'team') =>
  useQuery({ queryKey: ['crm', 'deals', scope ?? 'mine'], queryFn: () => api.getDeals(scope) });

export const useSiteVisits = (scope?: 'team') =>
  useQuery({ queryKey: ['crm', 'visits', scope ?? 'mine'], queryFn: () => api.getSiteVisits(scope) });

export const usePerformance = (enabled: boolean) =>
  useQuery({ queryKey: ['crm', 'performance'], queryFn: api.getPerformance, enabled });

const useInvalidateCrm = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['crm'] });
};

const crmMutation = <TInput,>(fn: (input: TInput) => Promise<unknown>) =>
  function useCrmMutation() {
    const invalidate = useInvalidateCrm();
    return useMutation({ mutationFn: fn, onSuccess: invalidate });
  };

export const useCreateLead = crmMutation(api.createLead);
export const useUpdateLead = crmMutation(
  ({ id, ...input }: { id: number } & Parameters<typeof api.updateLead>[1]) =>
    api.updateLead(id, input),
);
export const useAssignLead = crmMutation(
  ({ id, rmPersonId }: { id: number; rmPersonId: number }) => api.assignLead(id, rmPersonId),
);
export const usePromoteLead = crmMutation((id: number) => api.promoteLead(id));
export const useCreateDeal = crmMutation(api.createDeal);
export const useUpdateDeal = crmMutation(
  ({ id, ...input }: { id: number } & Parameters<typeof api.updateDeal>[1]) =>
    api.updateDeal(id, input),
);
export const useCreateSiteVisit = crmMutation(api.createSiteVisit);
