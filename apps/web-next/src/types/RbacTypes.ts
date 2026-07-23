// Response shapes of /trade-directory/api/rbac (see RbacService in
// apps/trade-directory/src/rbac/rbac.service.ts — keep in sync).

export interface ManifestUser {
  personId: number;
  name: string | null;
  email: string;
  orgId: number;
  isSuperAdmin: boolean;
  roles: { id: number; name: string }[];
}

export interface Manifest {
  user: ManifestUser;
  permissions: string[];
  categories: Record<string, string[]>;
}

export type PermissionDictionary = Record<
  string,
  { permKey: string; permDescription: string }[]
>;

export interface RoleSummary {
  id: number;
  name: string;
  description: string | null;
  isImmutable: boolean;
  permissionKeys: string[];
  memberCount: number;
  updatedAt: string;
}

export interface DirectoryUser {
  personId: number;
  name: string | null;
  email: string;
  designation: string | null;
  roles: { id: number; name: string; isImmutable: boolean }[];
}

export interface AuditRow {
  id: string;
  event: string;
  executedByPersonId: number | null;
  organizationId: number | null;
  targetType: string | null;
  targetId: number | null;
  metadataPayload: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditPage {
  total: number;
  rows: AuditRow[];
}
