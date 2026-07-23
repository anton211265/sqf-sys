// E2E test for Dynamic RBAC (roles/permissions/manifest/guards/audit).
// Runs on the HOST against the real stack — real Postgres, real HTTP through
// nginx, real passkey logins via the shared software authenticator. No mocks.
//
//   node apps/trade-directory/src/scripts/e2e-rbac.mjs
//
// Creates its own test identities (two users in the existing dev org, plus a
// second throwaway org for isolation tests), exercises every /api/rbac
// endpoint including safeguards (immutable role, last admin, tamper audit),
// and removes everything it created at the end.
//
// Requires Node >= 22.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { SoftAuthenticator, sha256 } from './lib/soft-authenticator.mjs';

const BASE = 'http://localhost/trade-directory';
const ORIGIN = 'http://localhost:3001';
const ORG_A = 2; // Synlian — existing dev org
const ADMIN_EMAIL = 'e2e-rbac-admin@test.local';
const USER_EMAIL = 'e2e-rbac-user@test.local';
const CREATED_EMAIL = 'e2e-rbac-created@test.local';
const ORGB_EMAIL = 'e2e-rbac-orgb@test.local';
const ORGB_USER_EMAIL = 'e2e-rbac-orgb-user@test.local';
const ORG_B_NAME = 'E2E RBAC Org B';
const TEST_ROLE = 'E2E Risk Officer';

let passed = 0;
let failed = 0;
const check = (name, condition, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${name} ${detail}`);
  }
};

const psql = (sql) =>
  execSync(
    `docker compose exec -T postgres psql -U postgres -d trade-directory -tAc ${JSON.stringify(
      sql.replace(/\s+/g, ' ').trim(),
    )}`,
    { cwd: process.cwd(), encoding: 'utf8' },
  ).trim();

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
}
const get = (path, token) => req('GET', path, undefined, token);
const post = (path, body, token) => req('POST', path, body, token);
const put = (path, body, token) => req('PUT', path, body, token);
const patch = (path, body, token) => req('PATCH', path, body, token);
const del = (path, token) => req('DELETE', path, undefined, token);

// ---------------------------------------------------------------------
// Identity helpers — register a passkey via enrollment token, then log in
// ---------------------------------------------------------------------
async function createLogin(email, orgId) {
  const authenticator = new SoftAuthenticator();
  const rawToken = randomBytes(48).toString('base64url');
  psql(
    `INSERT INTO enrollment_token ("personId", "tokenHash", "expiresAt")
     SELECT id, '${sha256(rawToken).toString('hex')}', LOCALTIMESTAMP + interval '1 hour'
     FROM person WHERE email = '${email}'`,
  );
  const regOptions = await post('/auth/passkey/register-options', {
    enrollmentToken: rawToken,
  });
  if (!regOptions.data?.options) {
    throw new Error(`register-options failed for ${email}: ${JSON.stringify(regOptions.data)}`);
  }
  await post('/auth/passkey/register-verify', {
    registrationSessionId: regOptions.data.registrationSessionId,
    response: authenticator.makeRegistrationResponse(regOptions.data.options.challenge),
  });
  const loginOptions = await post('/auth/passkey/login-options', { email, orgId });
  const loginVerify = await post('/auth/passkey/login-verify', {
    loginSessionId: loginOptions.data.loginSessionId,
    response: authenticator.makeAssertionResponse(loginOptions.data.options.challenge),
  });
  if (!loginVerify.data?.accessToken) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(loginVerify.data)}`);
  }
  return { authenticator, accessToken: loginVerify.data.accessToken };
}

// ---------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------
function setup() {
  teardown();
  for (const email of [ADMIN_EMAIL, USER_EMAIL]) {
    psql(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}', '${email}')`);
    psql(
      `INSERT INTO organization_person ("organizationId", "personId", designation)
       SELECT ${ORG_A}, id, 'E2E' FROM person WHERE email = '${email}'`,
    );
  }
  // Admin gets a LEGACY enum SUPERUSER row — the backfill script (real code
  // path) converts that into the immutable Super Admin role assignment.
  psql(
    `INSERT INTO organization_person_role (role, "organizationPersonId")
     SELECT 'SUPERUSER', op.id FROM organization_person op
     JOIN person p ON p.id = op."personId" WHERE p.email = '${ADMIN_EMAIL}'`,
  );

  // Org B with its own Super Admin, for isolation + last-admin tests.
  // Last-admin enforcement MUST run here, not in the shared dev org: org 2's
  // immutable role can have real holders (e.g. admin@sqf.local), so only the
  // script-owned org has a deterministic holder set.
  psql(`INSERT INTO organization ("organizationName", country) VALUES ('${ORG_B_NAME}', 'MY')`);
  psql(`INSERT INTO person (name, email) VALUES ('orgb-admin', '${ORGB_EMAIL}')`);
  psql(`INSERT INTO person (name, email) VALUES ('orgb-user', '${ORGB_USER_EMAIL}')`);
  psql(
    `INSERT INTO organization_person ("organizationId", "personId", designation)
     SELECT o.id, p.id, 'E2E' FROM organization o, person p
     WHERE o."organizationName" = '${ORG_B_NAME}' AND p.email IN ('${ORGB_EMAIL}', '${ORGB_USER_EMAIL}')`,
  );
  psql(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT 'Super Admin', true, id FROM organization WHERE "organizationName" = '${ORG_B_NAME}'`,
  );
  psql(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     JOIN organization o ON o.id = r."organizationId"
     WHERE p.email = '${ORGB_EMAIL}' AND o."organizationName" = '${ORG_B_NAME}'`,
  );
}

function teardown() {
  const emails = `'${ADMIN_EMAIL}','${USER_EMAIL}','${ORGB_EMAIL}','${ORGB_USER_EMAIL}','${CREATED_EMAIL}'`;
  psql(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  psql(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  psql(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  psql(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  psql(`DELETE FROM person_role WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  psql(`DELETE FROM organization_person_role WHERE "organizationPersonId" IN (
          SELECT op.id FROM organization_person op JOIN person p ON p.id = op."personId"
          WHERE p.email IN (${emails}))`);
  psql(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  psql(`DELETE FROM person WHERE email IN (${emails})`);
  psql(`DELETE FROM organization_role WHERE name = '${TEST_ROLE}'`);
  psql(`DELETE FROM rbac_audit_log WHERE "organizationId" IN (SELECT id FROM organization WHERE "organizationName" = '${ORG_B_NAME}')`);
  psql(`DELETE FROM organization_role WHERE "organizationId" IN (SELECT id FROM organization WHERE "organizationName" = '${ORG_B_NAME}')`);
  psql(`DELETE FROM organization WHERE "organizationName" = '${ORG_B_NAME}'`);
}

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
async function main() {
  process.stdout.write('Waiting for trade-directory to be ready');
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
      if (res.status === 404) break;
    } catch {
      /* not up yet */
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(' ready.');

  console.log('Setting up test identities…');
  setup();

  // ── [1] Backfill converts legacy SUPERUSER → immutable Super Admin ──
  console.log('\n[1] Legacy SUPERUSER backfill');
  execSync(
    'docker compose exec -T trade-directory-service npx ts-node -r tsconfig-paths/register apps/trade-directory/src/scripts/backfill-super-admin-roles.ts',
    { cwd: process.cwd(), stdio: 'pipe' },
  );
  const backfilled = psql(
    `SELECT COUNT(*) FROM person_role pr
     JOIN person p ON p.id = pr."personId"
     JOIN organization_role r ON r.id = pr."roleId"
     WHERE p.email = '${ADMIN_EMAIL}' AND r."isImmutable" = true`,
  );
  check('backfill assigned immutable Super Admin role to legacy SUPERUSER', backfilled === '1', backfilled);

  const admin = await createLogin(ADMIN_EMAIL, ORG_A);
  const user = await createLogin(USER_EMAIL, ORG_A);

  // ── [2] Manifest ──
  console.log('\n[2] Permissions manifest');
  const adminManifest = await get('/api/rbac/manifest', admin.accessToken);
  check('admin manifest: isSuperAdmin', adminManifest.data?.user?.isSuperAdmin === true, JSON.stringify(adminManifest.data?.user));
  // Dictionary size is read live so add-only permission migrations don't
  // break this assertion — the invariant is "Super Admin holds every key".
  const dictSize = parseInt(psql('SELECT COUNT(*) FROM permission'), 10);
  check(
    `admin manifest: all ${dictSize} dictionary permissions implicit`,
    dictSize > 0 && adminManifest.data?.permissions?.length === dictSize,
    String(adminManifest.data?.permissions?.length),
  );
  check('manifest exposes categories', Object.keys(adminManifest.data?.categories ?? {}).length >= 7);

  const userManifest = await get('/api/rbac/manifest', user.accessToken);
  check('regular user manifest: no permissions yet', userManifest.data?.permissions?.length === 0 && userManifest.data?.user?.isSuperAdmin === false, JSON.stringify(userManifest.data?.permissions));

  // ── [3] Guard denies without permission ──
  console.log('\n[3] Permission guard');
  const denied = await get('/api/rbac/roles', user.accessToken);
  check('roles list denied without admin_roles_manage (403)', denied.status === 403);
  const unauthenticated = await get('/api/rbac/roles');
  check('roles list denied without token (403)', unauthenticated.status === 403);
  const adminRoles = await get('/api/rbac/roles', admin.accessToken);
  check('Super Admin passes guard implicitly', adminRoles.status === 200);
  check(
    'roles list shows immutable Super Admin role',
    (adminRoles.data ?? []).some((r) => r.isImmutable === true),
  );

  // ── [4] Role lifecycle ──
  console.log('\n[4] Role lifecycle');
  const dictionary = await get('/api/rbac/permissions', admin.accessToken);
  check('permission dictionary grouped by category', dictionary.status === 200 && Array.isArray(dictionary.data?.['Credit Risk']));

  const created = await post('/api/rbac/roles', { name: TEST_ROLE, description: 'E2E role' }, admin.accessToken);
  check('role created', created.status === 201 && !!created.data?.id, JSON.stringify(created.data));
  const roleId = created.data.id;

  const duplicate = await post('/api/rbac/roles', { name: TEST_ROLE }, admin.accessToken);
  check('duplicate role name rejected (409)', duplicate.status === 409);

  const badKeys = await put(`/api/rbac/roles/${roleId}/permissions`, { permissionKeys: ['not_a_real_key'] }, admin.accessToken);
  check('unknown permission key rejected (400)', badKeys.status === 400);

  const grantKeys = ['risk_applications_view', 'risk_applications_assess', 'admin_users_view'];
  const granted = await put(`/api/rbac/roles/${roleId}/permissions`, { permissionKeys: grantKeys }, admin.accessToken);
  check('permission set saved', granted.status === 200 && granted.data?.permissionKeys?.length === 3, JSON.stringify(granted.data));

  const assigned = await post(`/api/rbac/users/${userManifest.data.user.personId}/roles`, { roleId }, admin.accessToken);
  check('role assigned to user', assigned.status === 201, JSON.stringify(assigned.data));

  const userManifest2 = await get('/api/rbac/manifest', user.accessToken);
  check(
    'user manifest reflects granted keys immediately',
    JSON.stringify([...(userManifest2.data?.permissions ?? [])].sort()) === JSON.stringify([...grantKeys].sort()),
    JSON.stringify(userManifest2.data?.permissions),
  );

  // ── [5] Guard flips live with permission changes ──
  console.log('\n[5] Live guard flip');
  const nowAllowed = await get('/api/rbac/users', user.accessToken);
  check('user passes admin_users_view-guarded endpoint (200)', nowAllowed.status === 200);
  check(
    'user directory lists role chips',
    (nowAllowed.data ?? []).some((u) => u.email === USER_EMAIL && u.roles.some((r) => r.name === TEST_ROLE)),
  );

  const shrunk = await put(`/api/rbac/roles/${roleId}/permissions`, { permissionKeys: ['risk_applications_view'] }, admin.accessToken);
  check('permission set shrunk', shrunk.status === 200);
  const revokedNow = await get('/api/rbac/users', user.accessToken);
  check('guard denies immediately after permission removal (403)', revokedNow.status === 403);

  // ── [5b] Create user (admin_users_create + pre-authorized first link) ──
  console.log('\n[5b] Create user');
  const createDenied = await post('/api/rbac/users', { name: 'X', email: CREATED_EMAIL }, user.accessToken);
  check('create user denied without admin_users_create (403)', createDenied.status === 403);
  const createdUser = await post('/api/rbac/users', { name: 'Created ByE2E', email: CREATED_EMAIL, designation: 'Analyst' }, admin.accessToken);
  check(
    'user created with first enrollment link (201)',
    createdUser.status === 201 && !!createdUser.data?.personId && String(createdUser.data?.enrollmentUrl).includes('/enroll#token='),
    JSON.stringify(createdUser.data),
  );
  const dupUser = await post('/api/rbac/users', { name: 'Dup', email: CREATED_EMAIL }, admin.accessToken);
  check('duplicate email rejected (409)', dupUser.status === 409);
  const directoryAfterCreate = await get('/api/rbac/users', admin.accessToken);
  check(
    'created user appears in directory with no roles',
    (directoryAfterCreate.data ?? []).some((u) => u.email === CREATED_EMAIL && u.roles.length === 0),
  );

  // ── [6] Immutable role guards ──
  console.log('\n[6] Immutable Super Admin guards');
  const superAdminRole = (adminRoles.data ?? []).find((r) => r.isImmutable);
  const rename = await patch(`/api/rbac/roles/${superAdminRole.id}`, { name: 'Hacked' }, admin.accessToken);
  check('immutable role rename blocked (403)', rename.status === 403);
  const remove = await del(`/api/rbac/roles/${superAdminRole.id}`, admin.accessToken);
  check('immutable role delete blocked (403)', remove.status === 403);
  const editPerms = await put(`/api/rbac/roles/${superAdminRole.id}/permissions`, { permissionKeys: [] }, admin.accessToken);
  check('immutable role permission edit blocked (403)', editPerms.status === 403);

  // ── [7] Last-admin enforcement (Org B — script-owned holder set; the
  //        shared dev org may have real Super Admin holders, which would
  //        make "last holder" nondeterministic) ──
  console.log('\n[7] Last-admin enforcement');
  const adminPersonId = adminManifest.data.user.personId;
  const orgBId = parseInt(psql(`SELECT id FROM organization WHERE "organizationName" = '${ORG_B_NAME}'`), 10);
  const orgB = await createLogin(ORGB_EMAIL, orgBId);
  const orgBManifest = await get('/api/rbac/manifest', orgB.accessToken);
  const orgBRolesForAdmin = await get('/api/rbac/roles', orgB.accessToken);
  const orgBSuperRole = (orgBRolesForAdmin.data ?? []).find((r) => r.isImmutable);
  const orgbUserPersonId = parseInt(psql(`SELECT id FROM person WHERE email = '${ORGB_USER_EMAIL}'`), 10);

  const lastAdmin = await del(`/api/rbac/users/${orgBManifest.data.user.personId}/roles/${orgBSuperRole.id}`, orgB.accessToken);
  check('removing last Super Admin holder blocked (400)', lastAdmin.status === 400, JSON.stringify(lastAdmin.data));

  const secondAdmin = await post(`/api/rbac/users/${orgbUserPersonId}/roles`, { roleId: orgBSuperRole.id }, orgB.accessToken);
  check('second Super Admin assigned', secondAdmin.status === 201, JSON.stringify(secondAdmin.data));
  const removeSecond = await del(`/api/rbac/users/${orgbUserPersonId}/roles/${orgBSuperRole.id}`, orgB.accessToken);
  check('removal allowed when not the last holder (200)', removeSecond.status === 200);

  // ── [8] Org isolation ──
  console.log('\n[8] Tenant isolation');
  const orgBRoles = await get('/api/rbac/roles', orgB.accessToken);
  check(
    'org B admin sees only org B roles',
    orgBRoles.status === 200 && (orgBRoles.data ?? []).every((r) => r.name !== TEST_ROLE),
    JSON.stringify(orgBRoles.data?.map((r) => r.name)),
  );
  const crossOrgEdit = await patch(`/api/rbac/roles/${roleId}`, { name: 'Stolen' }, orgB.accessToken);
  check('org B cannot touch org A role (404)', crossOrgEdit.status === 404);
  const crossOrgAssign = await post(`/api/rbac/users/${userManifest.data.user.personId}/roles`, { roleId }, orgB.accessToken);
  check('org B cannot assign org A roles/users (400/404)', crossOrgAssign.status === 404 || crossOrgAssign.status === 400);

  // ── [9] Rename + delete flow ──
  console.log('\n[9] Rename and delete');
  const renamed = await patch(`/api/rbac/roles/${roleId}`, { name: `${TEST_ROLE}`, description: 'renamed desc' }, admin.accessToken);
  check('mutable role update works', renamed.status === 200);
  // Explicit unassign (org A) — also keeps a USER_ROLE_REMOVED event in this
  // org's audit ledger now that last-admin enforcement runs in Org B.
  const unassigned = await del(`/api/rbac/users/${userManifest.data.user.personId}/roles/${roleId}`, admin.accessToken);
  check('role unassigned from user (200)', unassigned.status === 200, JSON.stringify(unassigned.data));
  const deleted = await del(`/api/rbac/roles/${roleId}`, admin.accessToken);
  check('mutable role delete works', deleted.status === 200);
  const userManifest3 = await get('/api/rbac/manifest', user.accessToken);
  check('deleted role\'s keys gone from user manifest', userManifest3.data?.permissions?.length === 0, JSON.stringify(userManifest3.data?.permissions));

  // ── [10] Session kill switch ──
  console.log('\n[10] Session revocation');
  const revoke = await post(`/api/rbac/users/${userManifest.data.user.personId}/revoke-sessions`, {}, admin.accessToken);
  check('sessions revoked', revoke.status === 201 && revoke.data?.revokedSessions >= 1, JSON.stringify(revoke.data));
  const denyUnpermissioned = await post(`/api/rbac/users/${adminPersonId}/revoke-sessions`, {}, user.accessToken);
  check('revoke-sessions requires admin_sessions_terminate (403)', denyUnpermissioned.status === 403);

  // ── [11] Audit ledger ──
  console.log('\n[11] Audit ledger');
  const audit = await get('/api/rbac/audit?limit=100', admin.accessToken);
  check('audit ledger readable', audit.status === 200 && audit.data?.total > 0);
  const events = new Set((audit.data?.rows ?? []).map((r) => r.event));
  for (const expected of [
    'USER_CREATED',
    'ROLE_CREATED',
    'ROLE_UPDATED',
    'ROLE_DELETED',
    'ROLE_PERMISSIONS_CHANGED',
    'USER_ROLE_ASSIGNED',
    'USER_ROLE_REMOVED',
    'SESSIONS_REVOKED',
    'TAMPER_ATTEMPT',
  ]) {
    check(`audit has ${expected}`, events.has(expected), [...events].join(','));
  }
  const permChange = (audit.data?.rows ?? []).find(
    (r) => r.event === 'ROLE_PERMISSIONS_CHANGED' && r.metadataPayload?.historical_state,
  );
  check(
    'permission change captured with historical/transformed snapshots',
    !!permChange &&
      Array.isArray(permChange.metadataPayload.historical_state.permission_keys) &&
      Array.isArray(permChange.metadataPayload.transformed_state.permission_keys),
    JSON.stringify(permChange?.metadataPayload),
  );
  const auditDenied = await get('/api/rbac/audit', user.accessToken);
  check('audit requires admin_audit_view (403)', auditDenied.status === 403);

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  console.log('Cleaning up test identities…');
  teardown();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\nE2E run crashed:', err);
  try {
    teardown();
  } catch {
    /* best effort */
  }
  process.exit(1);
});
