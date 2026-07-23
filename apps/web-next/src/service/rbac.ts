import axiosClient from 'api/axiosClient';
import {
  AuditPage,
  DirectoryUser,
  Manifest,
  PermissionDictionary,
  RoleSummary,
} from 'types/RbacTypes';

const BASE = '/trade-directory/api/rbac';

export const getManifest = async (): Promise<Manifest> =>
  (await axiosClient().get(`${BASE}/manifest`)).data;

export const getPermissionDictionary = async (): Promise<PermissionDictionary> =>
  (await axiosClient().get(`${BASE}/permissions`)).data;

export const getRoles = async (): Promise<RoleSummary[]> =>
  (await axiosClient().get(`${BASE}/roles`)).data;

export const createRole = async (input: { name: string; description?: string }) =>
  (await axiosClient().post(`${BASE}/roles`, input)).data;

export const updateRole = async (
  id: number,
  input: { name?: string; description?: string },
) => (await axiosClient().patch(`${BASE}/roles/${id}`, input)).data;

export const deleteRole = async (id: number) =>
  (await axiosClient().delete(`${BASE}/roles/${id}`)).data;

export const setRolePermissions = async (id: number, permissionKeys: string[]) =>
  (await axiosClient().put(`${BASE}/roles/${id}/permissions`, { permissionKeys }))
    .data;

export const getUsers = async (): Promise<DirectoryUser[]> =>
  (await axiosClient().get(`${BASE}/users`)).data;

export const createUser = async (input: {
  name: string;
  email: string;
  designation?: string;
}): Promise<{
  personId: number;
  name: string;
  email: string;
  enrollmentUrl: string;
  enrollmentExpiresAt: string;
}> => (await axiosClient().post(`${BASE}/users`, input)).data;

export const assignRole = async (personId: number, roleId: number) =>
  (await axiosClient().post(`${BASE}/users/${personId}/roles`, { roleId })).data;

export const removeRole = async (personId: number, roleId: number) =>
  (await axiosClient().delete(`${BASE}/users/${personId}/roles/${roleId}`)).data;

export const getAudit = async (limit: number, offset: number): Promise<AuditPage> =>
  (await axiosClient().get(`${BASE}/audit`, { params: { limit, offset } })).data;

export const revokeSessions = async (
  personId: number,
): Promise<{ revokedSessions: number }> =>
  (await axiosClient().post(`${BASE}/users/${personId}/revoke-sessions`, {})).data;

/** Re-issue a passkey enrollment link (24h, single-use) for an existing user. */
export const issueEnrollmentToken = async (
  email: string,
): Promise<{ enrollmentUrl: string; expiresAt: string }> =>
  (
    await axiosClient().post('/trade-directory/auth/passkey/enrollment-tokens', {
      email,
    })
  ).data;
