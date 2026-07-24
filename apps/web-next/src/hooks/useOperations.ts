import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from 'service/operations';

export const useOpsCases = () =>
  useQuery({ queryKey: ['ops', 'cases'], queryFn: api.getOpsCases });

export const useOpsCaseAction = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: any; note?: string }) =>
      api.opsCaseAction(id, action, note),
    onSuccess: () => client.invalidateQueries({ queryKey: ['ops'] }),
  });
};
