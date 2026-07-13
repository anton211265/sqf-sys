import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  createContract,
  createInvoice,
  createRelationship,
  createSubscription,
  getContracts,
  getDirectoryOrganizations,
  getInvoices,
  getRelationships,
  getSubscriptions,
  updateContract,
  updateInvoiceStatus,
  updateRelationship,
  updateSubscription,
} from 'service/tradeDirectory';

export const useDirectoryOrganizations = () =>
  useQuery(['td-directory-organizations'], getDirectoryOrganizations);

export const useRelationships = (organizationId?: number) =>
  useQuery(['td-relationships', organizationId], () =>
    getRelationships(organizationId),
  );

export const useContracts = (filters?: {
  contractType?: string;
  organizationId?: number;
}) => useQuery(['td-contracts', filters], () => getContracts(filters));

export const useInvoices = (filters?: {
  status?: string;
  issuerOrganizationId?: number;
  debtorOrganizationId?: number;
}) => useQuery(['td-invoices', filters], () => getInvoices(filters));

export const useSubscriptions = (clientPersonaId?: number) =>
  useQuery(['td-subscriptions', clientPersonaId], () =>
    getSubscriptions(clientPersonaId),
  );

const useInvalidating = <TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
  keys: string[],
) => {
  const queryClient = useQueryClient();
  return useMutation(fn, {
    onSuccess: () => keys.forEach((key) => queryClient.invalidateQueries(key)),
  });
};

export const useCreateRelationship = () =>
  useInvalidating(createRelationship, ['td-relationships']);
export const useUpdateRelationship = () =>
  useInvalidating(updateRelationship, ['td-relationships']);
export const useCreateContract = () =>
  useInvalidating(createContract, ['td-contracts']);
export const useUpdateContract = () =>
  useInvalidating(updateContract, ['td-contracts']);
export const useCreateInvoice = () =>
  useInvalidating(createInvoice, ['td-invoices']);
export const useUpdateInvoiceStatus = () =>
  useInvalidating(updateInvoiceStatus, ['td-invoices']);
export const useCreateSubscription = () =>
  useInvalidating(createSubscription, ['td-subscriptions']);
export const useUpdateSubscription = () =>
  useInvalidating(updateSubscription, ['td-subscriptions']);
