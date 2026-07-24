import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/offers';

export const useOffers = () =>
  useQuery({ queryKey: ['offers', 'list'], queryFn: api.getOffers });

export const useOffer = (id: number | null) =>
  useQuery({
    queryKey: ['offers', 'detail', id],
    queryFn: () => api.getOffer(id as number),
    enabled: id !== null,
  });

const useInvalidateOffers = () => {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['offers'] });
};

export const useCreateOffer = () => {
  const invalidate = useInvalidateOffers();
  return useMutation({ mutationFn: api.createOffer, onSuccess: invalidate });
};

export const useSaveOffer = () => {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: ({ id, inputs }: { id: number; inputs: Record<string, any> }) =>
      api.saveOffer(id, inputs),
    onSuccess: invalidate,
  });
};

export const useOfferAction = () => {
  const invalidate = useInvalidateOffers();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: any; note?: string }) =>
      ['accept', 'decline', 'refresh', 'close'].includes(action)
        ? api.resolveOffer(id, action, note)
        : api.offerAction(id, action, note),
    onSuccess: invalidate,
  });
};

export const useConfirmOfferFee = () => {
  const invalidate = useInvalidateOffers();
  return useMutation({ mutationFn: api.confirmOfferFee, onSuccess: invalidate });
};

export const useSimulate = () =>
  useMutation({
    mutationFn: ({ scenario, inputs }: { scenario: string; inputs: Record<string, any> }) =>
      api.simulateOffer(scenario, inputs),
  });
