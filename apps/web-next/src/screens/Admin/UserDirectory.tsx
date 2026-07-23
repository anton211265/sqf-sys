import * as React from 'react';
import { Copy, KeyRound, Plus, Search, ShieldOff, X } from 'lucide-react';

import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { Sheet } from 'components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'components/ui/table';
import {
  useAssignRole,
  useCreateUser,
  useHasPermission,
  useIssueEnrollmentToken,
  useRemoveRole,
  useRevokeSessions,
  useRoles,
  useUsers,
} from 'hooks/useRbac';
import { DirectoryUser } from 'types/RbacTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * User Directory & Provisioning Portal (Dynanic RBAC.pdf §3.2): member
 * grid, 40% slide-out assignment drawer with dismissible role chips, a
 * live inherited-capability preview recomputed client-side before saving,
 * enrollment-link re-issue and the per-user session kill switch. Action
 * controls render only when their permission key is held — absent, never
 * disabled.
 */
const UserDirectory: React.FC = () => {
  const { data: users = [], isLoading } = useUsers();
  const hasPermission = useHasPermission();
  const canAssign = hasPermission('admin_users_assign_roles');
  const canManageRoles = hasPermission('admin_roles_manage');
  const canIssueEnrollment = hasPermission('admin_enrollment_tokens_issue');
  const canTerminate = hasPermission('admin_sessions_terminate');
  const canCreateUser = hasPermission('admin_users_create');
  // Role list (with permission sets, for the capability preview) needs
  // admin_roles_manage; without it the drawer still works from the roles
  // already visible on the directory rows.
  const { data: roles = [] } = useRoles(canManageRoles);

  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const revokeSessions = useRevokeSessions();
  const issueEnrollment = useIssueEnrollmentToken();
  const createUser = useCreateUser();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newEmail, setNewEmail] = React.useState('');
  const [newDesignation, setNewDesignation] = React.useState('');
  const [createError, setCreateError] = React.useState<string | null>(null);
  const [createdEnrollment, setCreatedEnrollment] = React.useState<{
    email: string;
    url: string;
  } | null>(null);

  const handleCreateUser = async () => {
    setCreateError(null);
    try {
      const result = await createUser.mutateAsync({
        name: newName.trim(),
        email: newEmail.trim(),
        designation: newDesignation.trim() || undefined,
      });
      setCreatedEnrollment({ email: result.email, url: result.enrollmentUrl });
      setNewName('');
      setNewEmail('');
      setNewDesignation('');
    } catch (e) {
      setCreateError(getApiResponseErrorMsg(e));
    }
  };

  const [search, setSearch] = React.useState('');
  const [openUserId, setOpenUserId] = React.useState<number | null>(null);
  const [pendingRoleIds, setPendingRoleIds] = React.useState<Set<number>>(new Set());
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [enrollmentUrl, setEnrollmentUrl] = React.useState<string | null>(null);
  const [confirmTerminate, setConfirmTerminate] = React.useState(false);

  const openUser: DirectoryUser | undefined = users.find(
    (u) => u.personId === openUserId,
  );

  React.useEffect(() => {
    setPendingRoleIds(new Set(openUser?.roles.map((r) => r.id) ?? []));
    setMessage(null);
    setError(null);
    setEnrollmentUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUserId, openUser?.roles.map((r) => r.id).join(',')]);

  const currentIds = new Set(openUser?.roles.map((r) => r.id) ?? []);
  const dirty =
    pendingRoleIds.size !== currentIds.size ||
    [...pendingRoleIds].some((id) => !currentIds.has(id));

  const roleName = (id: number): string =>
    roles.find((r) => r.id === id)?.name ??
    openUser?.roles.find((r) => r.id === id)?.name ??
    `role #${id}`;

  const roleIsImmutable = (id: number): boolean =>
    roles.find((r) => r.id === id)?.isImmutable ??
    openUser?.roles.find((r) => r.id === id)?.isImmutable ??
    false;

  // Live Inherited Permissions Preview: union of the pending roles'
  // permission sets, recomputed client-side as chips change.
  const previewKeys = React.useMemo(() => {
    if (!canManageRoles) return null;
    if ([...pendingRoleIds].some((id) => roleIsImmutable(id))) return 'ALL' as const;
    const keys = new Set<string>();
    for (const id of pendingRoleIds) {
      for (const key of roles.find((r) => r.id === id)?.permissionKeys ?? []) {
        keys.add(key);
      }
    }
    return [...keys].sort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingRoleIds, roles, canManageRoles]);

  const handleApply = async () => {
    if (!openUser) return;
    setError(null);
    setMessage(null);
    const toAdd = [...pendingRoleIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !pendingRoleIds.has(id));
    try {
      for (const id of toAdd) {
        await assignRole.mutateAsync({ personId: openUser.personId, roleId: id });
      }
      for (const id of toRemove) {
        await removeRole.mutateAsync({ personId: openUser.personId, roleId: id });
      }
      setMessage('Role assignments applied.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handleIssueEnrollment = async () => {
    if (!openUser) return;
    setError(null);
    try {
      const result = await issueEnrollment.mutateAsync(openUser.email);
      setEnrollmentUrl(result.enrollmentUrl);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handleTerminate = async () => {
    if (!openUser) return;
    setError(null);
    try {
      const result = await revokeSessions.mutateAsync(openUser.personId);
      setMessage(`Terminated ${result.revokedSessions} active session(s).`);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    } finally {
      setConfirmTerminate(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const assignableRoles = roles.filter((r) => !pendingRoleIds.has(r.id));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">User Directory</h1>
          <p className="text-sm text-muted-foreground">
            Organization members and their role assignments
          </p>
        </div>
        {canCreateUser && (
          <Button
            onClick={() => {
              setCreatedEnrollment(null);
              setCreateError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create User
          </Button>
        )}
      </div>

      <div className="mb-3 max-w-sm">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  Loading members…
                </TableCell>
              </TableRow>
            )}
            {filtered.map((user) => (
              <TableRow
                key={user.personId}
                className="cursor-pointer"
                onClick={() => setOpenUserId(user.personId)}
              >
                <TableCell className="font-medium">{user.name ?? '—'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.designation ?? '—'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length === 0 && (
                      <Badge variant="outline">no roles</Badge>
                    )}
                    {user.roles.map((role) => (
                      <Badge key={role.id} variant={role.isImmutable ? 'amber' : 'purple'}>
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* User Assignment Drawer (40% slide-out) */}
      <Sheet open={openUser !== undefined} onOpenChange={() => setOpenUserId(null)}>
        {openUser && (
          <div className="flex h-full flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold">{openUser.name ?? openUser.email}</h2>
              <p className="text-sm text-muted-foreground">
                {openUser.email}
                {openUser.designation ? ` · ${openUser.designation}` : ''}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Active roles</h3>
              <div className="flex flex-wrap gap-1.5">
                {pendingRoleIds.size === 0 && (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
                {[...pendingRoleIds].map((id) => (
                  <Badge key={id} variant={roleIsImmutable(id) ? 'amber' : 'purple'}>
                    {roleName(id)}
                    {canAssign && (
                      <button
                        type="button"
                        aria-label={`Remove ${roleName(id)}`}
                        onClick={() => {
                          const next = new Set(pendingRoleIds);
                          next.delete(id);
                          setPendingRoleIds(next);
                        }}
                        className="ml-0.5 hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {canAssign && canManageRoles && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Add role</h3>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value=""
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    if (!Number.isNaN(id)) {
                      setPendingRoleIds(new Set([...pendingRoleIds, id]));
                    }
                  }}
                >
                  <option value="">Select a role…</option>
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="rounded-md border bg-muted/40 p-3">
              <h3 className="mb-1 text-sm font-medium">Inherited permissions preview</h3>
              {previewKeys === null ? (
                <p className="text-xs text-muted-foreground">
                  Preview requires role-management permission.
                </p>
              ) : previewKeys === 'ALL' ? (
                <p className="text-xs text-amber-800">
                  Holds an immutable role — every permission, implicitly.
                </p>
              ) : previewKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">No permissions.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto font-mono text-xs leading-5 text-muted-foreground">
                  {previewKeys.map((key) => (
                    <div key={key}>{key}</div>
                  ))}
                </div>
              )}
              {dirty && (
                <p className="mt-2 text-xs text-amber-700">
                  Preview reflects unapplied chip changes.
                </p>
              )}
            </div>

            {canAssign && (
              <Button disabled={!dirty || assignRole.isPending || removeRole.isPending} onClick={handleApply}>
                Apply Changes
              </Button>
            )}

            {(canIssueEnrollment || canTerminate) && <hr />}

            {canIssueEnrollment && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={issueEnrollment.isPending}
                  onClick={handleIssueEnrollment}
                >
                  <KeyRound className="mr-2 h-4 w-4" /> Re-issue enrollment link
                </Button>
                {enrollmentUrl && (
                  <div className="rounded-md border bg-muted/40 p-2">
                    <p className="mb-1 text-xs text-muted-foreground">
                      One-time link, valid 24h — hand it to the user directly:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate text-xs">{enrollmentUrl}</code>
                      <button
                        type="button"
                        aria-label="Copy enrollment link"
                        onClick={() => navigator.clipboard?.writeText(enrollmentUrl)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {canTerminate && (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setConfirmTerminate(true)}
              >
                <ShieldOff className="mr-2 h-4 w-4" /> Force Terminate Sessions
              </Button>
            )}

            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </Sheet>

      {/* Create User: person + org membership + first enrollment link */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTitle>Create User</DialogTitle>
        <DialogDescription>
          Creates the account and issues a one-time passkey enrollment link
          (valid 24 hours). Assign roles afterwards from the directory.
        </DialogDescription>
        {createdEnrollment ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700">
              Account created for {createdEnrollment.email}.
            </p>
            <div className="rounded-md border bg-muted/40 p-2">
              <p className="mb-1 text-xs text-muted-foreground">
                One-time enrollment link — hand it to the user directly:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-xs">{createdEnrollment.url}</code>
                <button
                  type="button"
                  aria-label="Copy enrollment link"
                  onClick={() => navigator.clipboard?.writeText(createdEnrollment.url)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCreateOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-user-name">Full name</Label>
                <Input
                  id="new-user-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-user-email">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new-user-designation">Designation (optional)</Label>
                <Input
                  id="new-user-designation"
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                />
              </div>
              {createError && <p className="text-sm text-destructive">{createError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!newName.trim() || !newEmail.trim() || createUser.isPending}
                onClick={handleCreateUser}
              >
                {createUser.isPending ? 'Creating…' : 'Create & Issue Link'}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>

      <Dialog open={confirmTerminate} onOpenChange={setConfirmTerminate}>
        <DialogTitle>Force terminate sessions?</DialogTitle>
        <DialogDescription>
          All of {openUser?.name ?? openUser?.email}'s refresh tokens are revoked
          immediately; any access token dies within 15 minutes. Use when a device
          or account is compromised.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmTerminate(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={revokeSessions.isPending}
            onClick={handleTerminate}
          >
            Terminate Sessions
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default UserDirectory;
