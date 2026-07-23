import * as React from 'react';
import { ChevronDown, ChevronRight, Lock, Plus, Search } from 'lucide-react';

import { useDirtyGuard } from 'components/layout/dirty-guard';
import { Badge } from 'components/ui/badge';
import { Button } from 'components/ui/button';
import { Checkbox } from 'components/ui/checkbox';
import { Dialog, DialogDescription, DialogFooter, DialogTitle } from 'components/ui/dialog';
import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import {
  useCreateRole,
  useDeleteRole,
  usePermissionDictionary,
  useRoles,
  useSetRolePermissions,
  useUpdateRole,
} from 'hooks/useRbac';
import { cn } from 'lib/utils';
import { RoleSummary } from 'types/RbacTypes';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

/**
 * Dynamic Role Builder Workspace (Dynanic RBAC.pdf §3.1): 30/70
 * master-detail; permission matrix as per-category accordions with
 * Select All, inline key descriptions, dirty-state guard, and
 * whole-set-replace save (PUT roles/:id/permissions).
 */
const RoleBuilder: React.FC = () => {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: dictionary = {} } = usePermissionDictionary();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const savePermissions = useSetRolePermissions();
  const { isDirty, setDirty, confirmIfDirty } = useDirtyGuard();

  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState('');
  const [draftKeys, setDraftKeys] = React.useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [roleDialog, setRoleDialog] = React.useState<'create' | 'rename' | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [formName, setFormName] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');

  const selected: RoleSummary | undefined = roles.find((r) => r.id === selectedId);

  // Default selection + re-sync the draft whenever the selected role's
  // saved permission set changes (e.g. after save or role switch).
  React.useEffect(() => {
    if (!selected && roles.length > 0) setSelectedId(roles[0].id);
  }, [roles, selected]);
  React.useEffect(() => {
    setDraftKeys(new Set(selected?.permissionKeys ?? []));
    setDirty(false);
    setNotice(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.permissionKeys?.join(',')]);

  const markDraft = (next: Set<string>) => {
    setDraftKeys(next);
    const original = new Set(selected?.permissionKeys ?? []);
    const changed =
      next.size !== original.size || [...next].some((k) => !original.has(k));
    setDirty(changed);
    setNotice(null);
  };

  const toggleKey = (key: string) => {
    const next = new Set(draftKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    markDraft(next);
  };

  const toggleCategory = (keys: string[], allChecked: boolean) => {
    const next = new Set(draftKeys);
    keys.forEach((k) => (allChecked ? next.delete(k) : next.add(k)));
    markDraft(next);
  };

  const handleSave = async () => {
    if (!selected) return;
    setError(null);
    try {
      await savePermissions.mutateAsync({
        id: selected.id,
        permissionKeys: [...draftKeys],
      });
      setDirty(false);
      setNotice('Permission set saved.');
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const openCreate = () =>
    confirmIfDirty(() => {
      setFormName('');
      setFormDescription('');
      setRoleDialog('create');
    });

  const submitRoleDialog = async () => {
    setError(null);
    try {
      if (roleDialog === 'create') {
        const created = await createRole.mutateAsync({
          name: formName,
          description: formDescription || undefined,
        });
        setSelectedId(created.id);
      } else if (roleDialog === 'rename' && selected) {
        await updateRole.mutateAsync({
          id: selected.id,
          name: formName,
          description: formDescription || undefined,
        });
      }
      setRoleDialog(null);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setError(null);
    try {
      await deleteRole.mutateAsync(selected.id);
      setConfirmDelete(false);
      setSelectedId(null);
      setDirty(false);
    } catch (e) {
      setError(getApiResponseErrorMsg(e));
      setConfirmDelete(false);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex h-full min-h-screen">
      {/* Role Registry Sidebar (30%) */}
      <div className="flex w-[30%] max-w-xs shrink-0 flex-col gap-3 border-r bg-background p-4">
        <Button onClick={openCreate} className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Create New Role
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {rolesLoading && (
            <p className="p-2 text-sm text-muted-foreground">Loading roles…</p>
          )}
          {filteredRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => confirmIfDirty(() => setSelectedId(role.id))}
              className={cn(
                'w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
                role.id === selectedId && 'bg-muted font-medium',
              )}
            >
              <span className="flex items-center gap-2">
                {role.isImmutable && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="truncate">{role.name}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {role.memberCount} member{role.memberCount === 1 ? '' : 's'}
                {!role.isImmutable && ` · ${role.permissionKeys.length} permissions`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix Accordion Desk (70%) */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <p className="text-sm text-muted-foreground">
            Select a role, or create one to begin.
          </p>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-xl font-semibold">
                  {selected.name}
                  {selected.isImmutable && <Badge variant="amber">Immutable</Badge>}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {selected.description ?? 'No description'}
                </p>
              </div>
              {!selected.isImmutable && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormName(selected.name);
                      setFormDescription(selected.description ?? '');
                      setRoleDialog('rename');
                    }}
                  >
                    Rename
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {selected.isImmutable && (
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                The Super Admin role holds every permission implicitly — including
                keys added in the future. It cannot be renamed, deleted or edited.
              </div>
            )}

            <div className="space-y-3">
              {Object.entries(dictionary).map(([category, perms]) => {
                const keys = perms.map((p) => p.permKey);
                const grantedCount = selected.isImmutable
                  ? keys.length
                  : keys.filter((k) => draftKeys.has(k)).length;
                const allChecked = grantedCount === keys.length;
                const isCollapsed = collapsed.has(category);
                return (
                  <div key={category} className="rounded-lg border bg-background">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-2 text-left"
                        onClick={() => {
                          const next = new Set(collapsed);
                          if (next.has(category)) next.delete(category);
                          else next.add(category);
                          setCollapsed(next);
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{category}</span>
                        <span className="text-xs text-muted-foreground">
                          {grantedCount}/{keys.length}
                        </span>
                      </button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        Select All
                        <Checkbox
                          aria-label={`Select all ${category}`}
                          checked={allChecked}
                          indeterminate={grantedCount > 0 && !allChecked}
                          disabled={selected.isImmutable}
                          onCheckedChange={() => toggleCategory(keys, allChecked)}
                        />
                      </div>
                    </div>
                    {!isCollapsed && (
                      <div className="space-y-3 border-t px-4 py-3">
                        {perms.map((perm) => (
                          <label
                            key={perm.permKey}
                            className="flex cursor-pointer items-start gap-3"
                          >
                            <Checkbox
                              aria-label={perm.permKey}
                              checked={selected.isImmutable || draftKeys.has(perm.permKey)}
                              disabled={selected.isImmutable}
                              onCheckedChange={() => toggleKey(perm.permKey)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="block font-mono text-sm">{perm.permKey}</span>
                              <span className="block text-xs text-muted-foreground">
                                {perm.permDescription}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!selected.isImmutable && (
              <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t bg-muted/30 py-3 backdrop-blur">
                {error && <span className="text-sm text-destructive">{error}</span>}
                {notice && <span className="text-sm text-emerald-700">{notice}</span>}
                {isDirty && (
                  <span className="text-sm text-amber-700">Unsaved changes</span>
                )}
                <Button
                  variant="outline"
                  disabled={!isDirty}
                  onClick={() => {
                    setDraftKeys(new Set(selected.permissionKeys));
                    setDirty(false);
                  }}
                >
                  Discard
                </Button>
                <Button disabled={!isDirty || savePermissions.isPending} onClick={handleSave}>
                  {savePermissions.isPending ? 'Saving…' : 'Save Permission Set'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / rename dialog */}
      <Dialog open={roleDialog !== null} onOpenChange={() => setRoleDialog(null)}>
        <DialogTitle>{roleDialog === 'create' ? 'Create New Role' : 'Rename Role'}</DialogTitle>
        <DialogDescription>
          {roleDialog === 'create'
            ? 'The role starts with no permissions — tick capabilities after creating it.'
            : 'Renaming a role never changes its permission set or members.'}
        </DialogDescription>
        <div className="space-y-3">
          <div>
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Risk Operations Manager"
            />
          </div>
          <div>
            <Label htmlFor="role-desc">Description (optional)</Label>
            <Input
              id="role-desc"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setRoleDialog(null)}>
            Cancel
          </Button>
          <Button
            disabled={!formName.trim() || createRole.isPending || updateRole.isPending}
            onClick={submitRoleDialog}
          >
            {roleDialog === 'create' ? 'Create Role' : 'Save'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogTitle>Delete role?</DialogTitle>
        <DialogDescription>
          "{selected?.name}" will be removed from {selected?.memberCount ?? 0} member
          {selected?.memberCount === 1 ? '' : 's'}. Their access via this role ends
          within 30 seconds. This cannot be undone.
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={deleteRole.isPending} onClick={handleDelete}>
            Delete Role
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export default RoleBuilder;
