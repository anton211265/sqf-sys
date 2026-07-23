import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as rbac from 'service/rbac';

export const useManifest = () =>
  useQuery({ queryKey: ['rbac', 'manifest'], queryFn: rbac.getManifest });

/** Convenience: does the signed-in user hold this permission key? */
export const useHasPermission = () => {
  const { data } = useManifest();
  return (key: string): boolean =>
    data?.user?.isSuperAdmin === true ||
    (data?.permissions ?? []).includes(key);
};

export const usePermissionDictionary = (enabled = true) =>
  useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: rbac.getPermissionDictionary,
    enabled,
  });

export const useRoles = (enabled = true) =>
  useQuery({ queryKey: ['rbac', 'roles'], queryFn: rbac.getRoles, enabled });

export const useUsers = (enabled = true) =>
  useQuery({ queryKey: ['rbac', 'users'], queryFn: rbac.getUsers, enabled });

export const useAudit = (limit: number, offset: number) =>
  useQuery({
    queryKey: ['rbac', 'audit', limit, offset],
    queryFn: () => rbac.getAudit(limit, offset),
  });

const useInvalidate = () => {
  const client = useQueryClient();
  return (...keys: string[]) =>
    Promise.all(
      keys.map((key) => client.invalidateQueries({ queryKey: ['rbac', key] })),
    );
};

export const useCreateRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: rbac.createRole,
    onSuccess: () => invalidate('roles', 'audit'),
  });
};

export const useUpdateRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; name?: string; description?: string }) =>
      rbac.updateRole(id, input),
    onSuccess: () => invalidate('roles', 'audit'),
  });
};

export const useDeleteRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: rbac.deleteRole,
    onSuccess: () => invalidate('roles', 'users', 'audit'),
  });
};

export const useSetRolePermissions = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, permissionKeys }: { id: number; permissionKeys: string[] }) =>
      rbac.setRolePermissions(id, permissionKeys),
    onSuccess: () => invalidate('roles', 'manifest', 'audit'),
  });
};

export const useAssignRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ personId, roleId }: { personId: number; roleId: number }) =>
      rbac.assignRole(personId, roleId),
    onSuccess: () => invalidate('users', 'roles', 'audit'),
  });
};

export const useRemoveRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ personId, roleId }: { personId: number; roleId: number }) =>
      rbac.removeRole(personId, roleId),
    onSuccess: () => invalidate('users', 'roles', 'audit'),
  });
};

export const useRevokeSessions = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: rbac.revokeSessions,
    onSuccess: () => invalidate('audit'),
  });
};

export const useIssueEnrollmentToken = () =>
  useMutation({ mutationFn: rbac.issueEnrollmentToken });
