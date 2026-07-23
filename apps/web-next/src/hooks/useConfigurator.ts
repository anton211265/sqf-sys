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
