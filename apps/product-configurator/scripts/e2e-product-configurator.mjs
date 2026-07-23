// E2E test for the Product Configurator microservice. Runs on the HOST
// against the real stack — real Postgres (both DBs), real HTTP through
// nginx, real passkey logins, real cross-service RBAC via trade-directory's
// manifest. No mocks.
//
//   node apps/product-configurator/scripts/e2e-product-configurator.mjs
//
// All configurator writes happen in a script-created Org C so teardown can
// remove everything wholesale; an org-2 identity exists only to prove
// tenant isolation (it must NOT see Org C's rows and creates nothing).
//
// Requires Node >= 22.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  SoftAuthenticator,
  sha256,
} from '../../trade-directory/src/scripts/lib/soft-authenticator.mjs';

const TD_BASE = 'http://localhost/trade-directory';
const PC_BASE = 'http://localhost/product-configurator';
const ORIGIN = 'http://localhost:3001';
const ORG2 = 2;
const ORG_C_NAME = 'E2E CFG Org C';
const ADMIN_EMAIL = 'e2e-cfg-admin@test.local'; // Org C Super Admin
const VIEWER_EMAIL = 'e2e-cfg-viewer@test.local'; // Org C, config_products_view only
const ORG2_EMAIL = 'e2e-cfg-org2@test.local'; // org 2, isolation check only
const VIEWER_ROLE = 'E2E Config Viewer';

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

const psql = (db, sql) =>
  execSync(
    `docker compose exec -T postgres psql -U postgres -d ${JSON.stringify(db)} -tAc ${JSON.stringify(
      sql.replace(/\s+/g, ' ').trim(),
    )}`,
    { cwd: process.cwd(), encoding: 'utf8' },
  ).trim();
const td = (sql) => psql('trade-directory', sql);
const pc = (sql) => psql('product-configurator', sql);

async function req(base, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
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
const get = (path, token) => req(PC_BASE, 'GET', path, undefined, token);
const post = (path, body, token) => req(PC_BASE, 'POST', path, body, token);
const put = (path, body, token) => req(PC_BASE, 'PUT', path, body, token);
const patch = (path, body, token) => req(PC_BASE, 'PATCH', path, body, token);

async function createLogin(email, orgId) {
  const authenticator = new SoftAuthenticator();
  const rawToken = randomBytes(48).toString('base64url');
  td(
    `INSERT INTO enrollment_token ("personId", "tokenHash", "expiresAt")
     SELECT id, '${sha256(rawToken).toString('hex')}', LOCALTIMESTAMP + interval '1 hour'
     FROM person WHERE email = '${email}'`,
  );
  const regOptions = await req(TD_BASE, 'POST', '/auth/passkey/register-options', {
    enrollmentToken: rawToken,
  });
  if (!regOptions.data?.options) {
    throw new Error(`register-options failed for ${email}: ${JSON.stringify(regOptions.data)}`);
  }
  await req(TD_BASE, 'POST', '/auth/passkey/register-verify', {
    registrationSessionId: regOptions.data.registrationSessionId,
    response: authenticator.makeRegistrationResponse(regOptions.data.options.challenge),
  });
  const loginOptions = await req(TD_BASE, 'POST', '/auth/passkey/login-options', { email, orgId });
  const loginVerify = await req(TD_BASE, 'POST', '/auth/passkey/login-verify', {
    loginSessionId: loginOptions.data.loginSessionId,
    response: authenticator.makeAssertionResponse(loginOptions.data.options.challenge),
  });
  if (!loginVerify.data?.accessToken) {
    throw new Error(`login failed for ${email}: ${JSON.stringify(loginVerify.data)}`);
  }
  return { authenticator, accessToken: loginVerify.data.accessToken };
}

function setup() {
  teardown();
  // Org C with its own immutable Super Admin + a limited viewer
  td(`INSERT INTO organization ("organizationName", country) VALUES ('${ORG_C_NAME}', 'MY')`);
  for (const email of [ADMIN_EMAIL, VIEWER_EMAIL]) {
    td(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}', '${email}')`);
    td(
      `INSERT INTO organization_person ("organizationId", "personId", designation)
       SELECT o.id, p.id, 'E2E' FROM organization o, person p
       WHERE o."organizationName" = '${ORG_C_NAME}' AND p.email = '${email}'`,
    );
  }
  td(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT 'Super Admin', true, id FROM organization WHERE "organizationName" = '${ORG_C_NAME}'`,
  );
  td(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     JOIN organization o ON o.id = r."organizationId"
     WHERE p.email = '${ADMIN_EMAIL}' AND o."organizationName" = '${ORG_C_NAME}' AND r."isImmutable" = true`,
  );
  td(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT '${VIEWER_ROLE}', false, id FROM organization WHERE "organizationName" = '${ORG_C_NAME}'`,
  );
  td(
    `INSERT INTO role_permission ("roleId", "permissionId")
     SELECT r.id, perm.id FROM organization_role r
     JOIN organization o ON o.id = r."organizationId", permission perm
     WHERE r.name = '${VIEWER_ROLE}' AND o."organizationName" = '${ORG_C_NAME}'
       AND perm."permKey" = 'config_products_view'`,
  );
  td(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     JOIN organization o ON o.id = r."organizationId"
     WHERE p.email = '${VIEWER_EMAIL}' AND r.name = '${VIEWER_ROLE}' AND o."organizationName" = '${ORG_C_NAME}'`,
  );
  // Org-2 identity for the isolation check (second holder of the real
  // immutable role — never unassigned via API, so no last-admin interaction)
  td(`INSERT INTO person (name, email) VALUES ('cfg-org2', '${ORG2_EMAIL}')`);
  td(
    `INSERT INTO organization_person ("organizationId", "personId", designation)
     SELECT ${ORG2}, id, 'E2E' FROM person WHERE email = '${ORG2_EMAIL}'`,
  );
  td(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     WHERE p.email = '${ORG2_EMAIL}' AND r."organizationId" = ${ORG2} AND r."isImmutable" = true`,
  );
}

function teardown() {
  const orgCId = td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_C_NAME}'`);
  if (orgCId) {
    for (const table of [
      'product_config_audit_log',
      'client_product_assignment',
      'product_document_mapping',
    ]) {
      if (table === 'product_document_mapping') {
        pc(`DELETE FROM ${table} WHERE "productId" IN (SELECT id FROM product WHERE "funderOrganizationId" = ${orgCId})`);
      } else {
        pc(`DELETE FROM ${table} WHERE "funderOrganizationId" = ${orgCId}`);
      }
    }
    pc(`DELETE FROM master_rate_card WHERE "productId" IN (SELECT id FROM product WHERE "funderOrganizationId" = ${orgCId})`);
    pc(`DELETE FROM product WHERE "funderOrganizationId" = ${orgCId}`);
    pc(`DELETE FROM legal_document_template WHERE "funderOrganizationId" = ${orgCId}`);
    pc(`DELETE FROM outbox_event WHERE (payload->>'funderOrganizationId')::int = ${orgCId}`);
  }
  const emails = `'${ADMIN_EMAIL}','${VIEWER_EMAIL}','${ORG2_EMAIL}'`;
  td(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person_role WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  if (orgCId) {
    td(`DELETE FROM rbac_audit_log WHERE "organizationId" = ${orgCId}`);
    td(`DELETE FROM role_permission WHERE "roleId" IN (SELECT id FROM organization_role WHERE "organizationId" = ${orgCId})`);
    td(`DELETE FROM organization_role WHERE "organizationId" = ${orgCId}`);
    td(`DELETE FROM organization WHERE id = ${orgCId}`);
  }
}

async function main() {
  process.stdout.write('Waiting for product-configurator to be ready');
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${PC_BASE}/`, { signal: AbortSignal.timeout(2000) });
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
  const orgCId = parseInt(td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_C_NAME}'`), 10);
  const admin = await createLogin(ADMIN_EMAIL, orgCId);
  const viewer = await createLogin(VIEWER_EMAIL, orgCId);
  const org2Admin = await createLogin(ORG2_EMAIL, ORG2);

  // ── [1] Guard basics ──
  console.log('\n[1] Cross-service permission guard');
  const noToken = await get('/api/products');
  check('unauthenticated denied (403)', noToken.status === 403);
  const viewerList = await get('/api/products', viewer.accessToken);
  check('viewer with config_products_view can list (200, empty)', viewerList.status === 200 && viewerList.data.length === 0, JSON.stringify(viewerList.data));
  const viewerCreate = await post('/api/products', { productCode: 'AR', productName: 'x' }, viewer.accessToken);
  check('viewer denied create — missing config_products_manage (403)', viewerCreate.status === 403, JSON.stringify(viewerCreate.data));

  // ── [2] Product registry ──
  console.log('\n[2] Product registry');
  const ar = await post('/api/products', { productCode: 'AR', productName: 'Accounts Receivable Financing' }, admin.accessToken);
  check('standard product created (201)', ar.status === 201 && !!ar.data?.id, JSON.stringify(ar.data));
  const dup = await post('/api/products', { productCode: 'AR', productName: 'dup' }, admin.accessToken);
  check('duplicate product code rejected (400)', dup.status === 400);
  const ifp = await post('/api/products', { productCode: 'IF', productName: 'Invoice Factoring' }, admin.accessToken);
  check('second product created (201)', ifp.status === 201);
  const toggled = await patch(`/api/products/${ar.data.id}`, { isActive: false, changeReason: 'e2e toggle' }, admin.accessToken);
  check('product is_active toggle works', toggled.status === 200 && toggled.data.isActive === false);

  // ── [3] Rate card rules + lifecycle ──
  console.log('\n[3] Rate card versioning & rules');
  const badAdvance = await post(`/api/products/${ifp.data.id}/rate-cards`, { advanceRatePct: 0.5, interestRateApr: 0.08 }, admin.accessToken);
  check('IF advance rate outside 80–95% rejected (400)', badAdvance.status === 400, JSON.stringify(badAdvance.data));
  const badTenure = await post(`/api/products/${ifp.data.id}/rate-cards`, { maxTenureDays: 4000 }, admin.accessToken);
  check('tenure above 3650 rejected (400)', badTenure.status === 400);
  const badWindow = await post(`/api/products/${ifp.data.id}/rate-cards`, { minTenureDays: 100, maxTenureDays: 50 }, admin.accessToken);
  check('min > max tenure rejected (400)', badWindow.status === 400);

  const v1 = await post(`/api/products/${ifp.data.id}/rate-cards`, { advanceRatePct: 0.85, interestRateApr: 0.085, discountFeePct: 0.02, oneTimeAdminFee: 1500, minTenureDays: 30, maxTenureDays: 120 }, admin.accessToken);
  check('draft v1 created', v1.status === 201 && v1.data.status === 'DRAFT' && v1.data.versionNumber === 1, JSON.stringify(v1.data));
  const edited = await patch(`/api/rate-cards/${v1.data.id}`, { discountFeePct: 0.0215 }, admin.accessToken);
  check('draft editable', edited.status === 200 && parseFloat(edited.data.discountFeePct) === 0.0215);
  const viewerPublish = await post(`/api/rate-cards/${v1.data.id}/publish`, {}, viewer.accessToken);
  check('viewer denied publish (403)', viewerPublish.status === 403);
  const published = await post(`/api/rate-cards/${v1.data.id}/publish`, {}, admin.accessToken);
  check('v1 published', published.status === 201 && published.data.status === 'PUBLISHED');
  const editPublished = await patch(`/api/rate-cards/${v1.data.id}`, { discountFeePct: 0.03 }, admin.accessToken);
  check('published card not editable (400)', editPublished.status === 400);

  const v2 = await post(`/api/products/${ifp.data.id}/rate-cards`, { advanceRatePct: 0.9, interestRateApr: 0.09, oneTimeAdminFee: 1000, maxTenureDays: 150 }, admin.accessToken);
  check('draft v2 auto-numbered', v2.status === 201 && v2.data.versionNumber === 2);
  await post(`/api/rate-cards/${v2.data.id}/publish`, {}, admin.accessToken);
  const cards = await get(`/api/products/${ifp.data.id}/rate-cards`, admin.accessToken);
  const v1Row = cards.data.find((c) => c.versionNumber === 1);
  const v2Row = cards.data.find((c) => c.versionNumber === 2);
  check('publishing v2 archived v1 (one PUBLISHED per product)', v1Row?.status === 'ARCHIVED' && v2Row?.status === 'PUBLISHED', JSON.stringify(cards.data.map((c) => [c.versionNumber, c.status])));

  // ── [4] Legal templates + binding ──
  console.log('\n[4] Legal templates');
  const tmpl = await post('/api/legal-templates', {
    documentCode: 'NOTICE_OF_ASSIGNMENT',
    documentName: 'Notice of Assignment',
    templateBody: 'NOA for {{product_name}}: rate {{multiply assigned_interest_rate 100}}% fee USD {{assigned_admin_fee}} tenure {{tenure_days_limit}} days on {{currentDate}}',
  }, admin.accessToken);
  check('template created', tmpl.status === 201 && !!tmpl.data?.id, JSON.stringify(tmpl.data));
  const bound = await put(`/api/products/${ifp.data.id}/legal-templates`, { templateIds: [tmpl.data.id] }, admin.accessToken);
  check('template bound to product', bound.status === 200);
  const boundList = await get(`/api/products/${ifp.data.id}/legal-templates`, admin.accessToken);
  check('binding readable', boundList.status === 200 && boundList.data.some((t) => t.documentCode === 'NOTICE_OF_ASSIGNMENT'));

  // ── [5] Snapshotted assignment ──
  console.log('\n[5] Snapshotted assignment pattern');
  const assign = await post('/api/assignments', { organizationId: 9001, productId: ifp.data.id }, admin.accessToken);
  check('assignment snapshots published v2', assign.status === 201 && assign.data.sourceVersionNumber === 2 && parseFloat(assign.data.assignedInterestRate) === 0.09, JSON.stringify(assign.data));

  const v3 = await post(`/api/products/${ifp.data.id}/rate-cards`, { advanceRatePct: 0.95, interestRateApr: 0.12, oneTimeAdminFee: 9999 }, admin.accessToken);
  await post(`/api/rate-cards/${v3.data.id}/publish`, {}, admin.accessToken);
  const assignAfter = await get(`/api/assignments?organizationId=9001`, admin.accessToken);
  check('assignment immutable after v3 publish (snapshot pattern)', parseFloat(assignAfter.data[0].assignedInterestRate) === 0.09 && assignAfter.data[0].sourceVersionNumber === 2, JSON.stringify(assignAfter.data[0]));

  const render = await get(`/api/assignments/${assign.data.id}/render/${tmpl.data.id}`, admin.accessToken);
  check('handlebars preview renders injected values', render.status === 200 && render.data.rendered.includes('rate 9%') && render.data.rendered.includes('Invoice Factoring') && render.data.rendered.includes('150 days') && !render.data.rendered.includes('[missing:'), JSON.stringify(render.data));

  // ── [6] Bespoke products ──
  console.log('\n[6] Custom bespoke plan');
  const viewerBespoke = await post('/api/products/bespoke', { clientOwnerOrganizationId: 9001, productName: 'x', interestRateApr: 0.1 }, viewer.accessToken);
  check('viewer denied bespoke create (403)', viewerBespoke.status === 403);
  const bespoke = await post('/api/products/bespoke', {
    clientOwnerOrganizationId: 9001,
    productName: 'Bespoke Client Financial Package',
    interestRateApr: 0.11,
    formulaType: 'COMPOUND_DAILY',
    customVariables: [{ key: 'grace_period_days', value: '14' }],
  }, admin.accessToken);
  check('bespoke product + published v1 created', bespoke.status === 201 && bespoke.data.product.productCode.startsWith('CST_') && bespoke.data.rateCard.status === 'PUBLISHED', JSON.stringify(bespoke.data));
  const wrongClient = await post('/api/assignments', { organizationId: 9002, productId: bespoke.data.product.id }, admin.accessToken);
  check('bespoke restricted to owning client (400)', wrongClient.status === 400);
  const rightClient = await post('/api/assignments', { organizationId: 9001, productId: bespoke.data.product.id }, admin.accessToken);
  check('bespoke assignable to owning client', rightClient.status === 201);

  // ── [7] Tenant isolation ──
  console.log('\n[7] Tenant isolation');
  const org2List = await get('/api/products', org2Admin.accessToken);
  check('org 2 admin sees none of Org C products', org2List.status === 200 && !org2List.data.some((p) => p.funderOrganizationId === orgCId), JSON.stringify(org2List.data.map((p) => p.productCode)));

  // ── [8] Audit + outbox ──
  console.log('\n[8] Audit trail & outbox');
  const audit = await get('/api/audit', admin.accessToken);
  const actions = new Set((audit.data?.rows ?? []).map((r) => r.actionPerformed));
  for (const expected of ['CREATE', 'UPDATE', 'PUBLISH', 'ARCHIVE', 'BIND']) {
    check(`audit has ${expected}`, actions.has(expected), [...actions].join(','));
  }
  const updateRow = (audit.data?.rows ?? []).find((r) => r.actionPerformed === 'UPDATE' && r.oldValues);
  check('audit UPDATE carries old/new values', !!updateRow && updateRow.newValues !== null, JSON.stringify(updateRow?.oldValues));

  await new Promise((r) => setTimeout(r, 7000)); // let the 5s relay run
  const outboxRows = pc(`SELECT topic || ':' || status FROM outbox_event WHERE (payload->>'funderOrganizationId')::int = ${orgCId}`).split('\n').filter(Boolean);
  check('outbox rows written for publishes + assignments', outboxRows.filter((r) => r.startsWith('rate_card_published')).length >= 3 && outboxRows.filter((r) => r.startsWith('product_assignment_created')).length >= 2, outboxRows.join(','));
  check('outbox relay marked events sent', outboxRows.some((r) => r.endsWith(':sent')), outboxRows.join(','));

  // ── [9] Live permission revocation ──
  // Revoke through the real Role Builder endpoint (not raw SQL): the API
  // write busts trade-directory's manifest cache, which is what makes the
  // change visible cross-service. A fresh login gives this service's own
  // 30s grant cache a new key, so no stale entry on either side.
  console.log('\n[9] Permission revocation (fresh session)');
  const viewerRoleId = parseInt(td(`SELECT id FROM organization_role WHERE name = '${VIEWER_ROLE}' AND "organizationId" = ${orgCId}`), 10);
  const revokeSave = await req(TD_BASE, 'PUT', `/api/rbac/roles/${viewerRoleId}/permissions`, { permissionKeys: [] }, admin.accessToken);
  check('role permissions emptied via Role Builder API (200)', revokeSave.status === 200, JSON.stringify(revokeSave.data));
  const viewer2 = await createLogin(VIEWER_EMAIL, orgCId);
  const revoked = await get('/api/products', viewer2.accessToken);
  check('viewer denied after permission removed (403)', revoked.status === 403, JSON.stringify(revoked.data));

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
