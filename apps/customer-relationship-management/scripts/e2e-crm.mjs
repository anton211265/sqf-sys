// E2E test for the CRM domain (leads/deals/promotion/site-visits/
// performance). Runs on the HOST against the real stack — real Postgres,
// real HTTP through nginx, real passkey logins, real cross-service RBAC,
// and the real Kafka loop: promotion's SLA_TIMER_START must surface as a
// RUNNING timer in the product-configurator SLA engine. No mocks.
//
//   node apps/customer-relationship-management/scripts/e2e-crm.mjs
//
// All writes happen in a script-created Org D. Requires Node >= 22.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  SoftAuthenticator,
  sha256,
} from '../../trade-directory/src/scripts/lib/soft-authenticator.mjs';

const TD_BASE = 'http://localhost/trade-directory';
const CRM_BASE = 'http://localhost/customer-relationship-management';
const PC_BASE = 'http://localhost/product-configurator';
const ORIGIN = 'http://localhost:3001';
const ORG2 = 2;
const ORG_D_NAME = 'E2E CRM Org D';
const SUPER_EMAIL = 'e2e-crm-super@test.local';
const RM1_EMAIL = 'e2e-crm-rm1@test.local';
const RM2_EMAIL = 'e2e-crm-rm2@test.local';
const ORG2_EMAIL = 'e2e-crm-org2@test.local';
const RM_ROLE = 'E2E RM';
const RM_JUNIOR_ROLE = 'E2E RM Junior';

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
const crm = (sql) => psql('customer-relationship-management', sql);
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
const get = (path, token) => req(CRM_BASE, 'GET', path, undefined, token);
const post = (path, body, token) => req(CRM_BASE, 'POST', path, body, token);
const patch = (path, body, token) => req(CRM_BASE, 'PATCH', path, body, token);

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
  return { accessToken: loginVerify.data.accessToken };
}

const grantRole = (roleName, keys) => {
  td(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT '${roleName}', false, id FROM organization WHERE "organizationName" = '${ORG_D_NAME}'`,
  );
  for (const key of keys) {
    td(
      `INSERT INTO role_permission ("roleId", "permissionId")
       SELECT r.id, p.id FROM organization_role r
       JOIN organization o ON o.id = r."organizationId", permission p
       WHERE r.name = '${roleName}' AND o."organizationName" = '${ORG_D_NAME}'
         AND p."permKey" = '${key}'`,
    );
  }
};

function setup() {
  teardown();
  td(`INSERT INTO organization ("organizationName", country) VALUES ('${ORG_D_NAME}', 'MY')`);
  for (const email of [SUPER_EMAIL, RM1_EMAIL, RM2_EMAIL]) {
    td(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}', '${email}')`);
    td(
      `INSERT INTO organization_person ("organizationId", "personId", designation)
       SELECT o.id, p.id, 'E2E' FROM organization o, person p
       WHERE o."organizationName" = '${ORG_D_NAME}' AND p.email = '${email}'`,
    );
  }
  td(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT 'Super Admin', true, id FROM organization WHERE "organizationName" = '${ORG_D_NAME}'`,
  );
  td(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     JOIN organization o ON o.id = r."organizationId"
     WHERE p.email = '${SUPER_EMAIL}' AND o."organizationName" = '${ORG_D_NAME}' AND r."isImmutable" = true`,
  );
  grantRole(RM_ROLE, [
    'crm_pipeline_view',
    'crm_leads_manage',
    'crm_deals_manage',
    'crm_prospects_promote',
    'onboarding_site_visits_manage',
  ]);
  grantRole(RM_JUNIOR_ROLE, ['crm_pipeline_view']);
  for (const [email, role] of [
    [RM1_EMAIL, RM_ROLE],
    [RM2_EMAIL, RM_JUNIOR_ROLE],
  ]) {
    td(
      `INSERT INTO person_role ("personId", "roleId")
       SELECT p.id, r.id FROM person p, organization_role r
       JOIN organization o ON o.id = r."organizationId"
       WHERE p.email = '${email}' AND r.name = '${role}' AND o."organizationName" = '${ORG_D_NAME}'`,
    );
  }
  // org 2 identity for the isolation check
  td(`INSERT INTO person (name, email) VALUES ('crm-org2', '${ORG2_EMAIL}')`);
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
  const orgDId = td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_D_NAME}'`);
  if (orgDId) {
    for (const table of ['site_visit_report', 'deal_stage_history']) {
      if (table === 'deal_stage_history') {
        crm(`DELETE FROM ${table} WHERE "dealId" IN (SELECT id FROM deal WHERE "funderOrganizationId" = ${orgDId})`);
      } else {
        crm(`DELETE FROM ${table} WHERE "funderOrganizationId" = ${orgDId}`);
      }
    }
    crm(`DELETE FROM deal WHERE "funderOrganizationId" = ${orgDId}`);
    crm(`DELETE FROM lead WHERE "funderOrganizationId" = ${orgDId}`);
    crm(`DELETE FROM outbox_event WHERE (payload->>'funderOrganizationId')::int = ${orgDId} OR payload->>'emailSubject' LIKE '%financing application%'`);
    pc(`DELETE FROM sla_timer WHERE "funderOrganizationId" = ${orgDId}`);
    pc(`DELETE FROM sla_template WHERE "funderOrganizationId" = ${orgDId}`);
    pc(`DELETE FROM funder_config_settings WHERE "funderOrganizationId" = ${orgDId}`);
    pc(`DELETE FROM product_config_audit_log WHERE "funderOrganizationId" = ${orgDId}`);
  }
  const emails = `'${SUPER_EMAIL}','${RM1_EMAIL}','${RM2_EMAIL}','${ORG2_EMAIL}'`;
  td(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person_role WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  if (orgDId) {
    td(`DELETE FROM rbac_audit_log WHERE "organizationId" = ${orgDId}`);
    td(`DELETE FROM role_permission WHERE "roleId" IN (SELECT id FROM organization_role WHERE "organizationId" = ${orgDId})`);
    td(`DELETE FROM organization_role WHERE "organizationId" = ${orgDId}`);
    td(`DELETE FROM organization WHERE id = ${orgDId}`);
  }
}

async function main() {
  process.stdout.write('Waiting for services');
  for (const base of [CRM_BASE, PC_BASE]) {
    for (let i = 0; i < 30; i += 1) {
      try {
        const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) });
        if (res.status === 404) break;
      } catch {
        /* not up yet */
      }
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log(' ready.');

  console.log('Setting up test identities…');
  setup();
  const orgDId = parseInt(td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_D_NAME}'`), 10);
  const supervisor = await createLogin(SUPER_EMAIL, orgDId);
  const rm1 = await createLogin(RM1_EMAIL, orgDId);
  const rm2 = await createLogin(RM2_EMAIL, orgDId);
  const org2Admin = await createLogin(ORG2_EMAIL, ORG2);
  const rm1PersonId = parseInt(td(`SELECT id FROM person WHERE email = '${RM1_EMAIL}'`), 10);
  const rm2PersonId = parseInt(td(`SELECT id FROM person WHERE email = '${RM2_EMAIL}'`), 10);

  // The SLA template promotion starts (Section-1 process 4 response window)
  await req(PC_BASE, 'PUT', '/api/policies/slas', {
    slaCode: 'RM_ONBOARDING_RESPONSE',
    slaName: 'RM-initiated onboarding response window',
    windowValue: 5,
    windowUnit: 'WORKING_DAYS',
    breachAction: 'NOTIFY_RM',
  }, supervisor.accessToken);

  // ── [1] Guard basics ──
  console.log('\n[1] Permission guard');
  const noToken = await get('/api/crm/leads');
  check('unauthenticated denied (403)', noToken.status === 403);
  const rm2Create = await post('/api/crm/leads', { companyName: 'X' }, rm2.accessToken);
  check('lead create denied without crm_leads_manage (403)', rm2Create.status === 403);

  // ── [2] Lead lifecycle ──
  console.log('\n[2] Lead lifecycle');
  const lead1 = await post('/api/crm/leads', {
    companyName: 'Acme Widgets Sdn Bhd',
    contactName: 'Jo Tan',
    contactEmail: 'jo.tan@acme-widgets.test',
    source: 'Trade fair',
  }, rm1.accessToken);
  check('lead created (LEAD, owner = creator)', lead1.status === 201 && lead1.data.status === 'LEAD' && lead1.data.ownerRmPersonId === rm1PersonId, JSON.stringify(lead1.data));
  const rm1Leads = await get('/api/crm/leads', rm1.accessToken);
  const rm2Leads = await get('/api/crm/leads', rm2.accessToken);
  check('own-scope queue rule (rm1 sees 1, rm2 sees 0)', rm1Leads.data.length === 1 && rm2Leads.data.length === 0);
  const rm2Team = await get('/api/crm/leads?scope=team', rm2.accessToken);
  check('team scope denied without crm_supervisor_view (403)', rm2Team.status === 403);
  const superTeam = await get('/api/crm/leads?scope=team', supervisor.accessToken);
  check('supervisor team scope sees all leads', superTeam.status === 200 && superTeam.data.some((l) => l.id === lead1.data.id));

  const qualified = await patch(`/api/crm/leads/${lead1.data.id}`, { status: 'PROSPECT' }, rm1.accessToken);
  check('lead qualified → PROSPECT (qualifiedAt set)', qualified.status === 200 && qualified.data.status === 'PROSPECT' && !!qualified.data.qualifiedAt);
  const badTransition = await patch(`/api/crm/leads/${lead1.data.id}`, { status: 'PROMOTED' }, rm1.accessToken);
  check('direct PATCH to PROMOTED rejected (400)', badTransition.status === 400);

  // ── [3] Promotion (Section-1 process 4, CRM side) ──
  console.log('\n[3] Prospect promotion');
  const rm2Promote = await post(`/api/crm/leads/${lead1.data.id}/promote`, {}, rm2.accessToken);
  check('promote denied without crm_prospects_promote (403)', rm2Promote.status === 403);
  const lead2 = await post('/api/crm/leads', { companyName: 'Beta Traders', contactEmail: 'ops@beta-traders.test' }, rm1.accessToken);
  const promoteUnqualified = await post(`/api/crm/leads/${lead2.data.id}/promote`, {}, rm1.accessToken);
  check('promoting an unqualified LEAD rejected (400)', promoteUnqualified.status === 400);
  const promoted = await post(`/api/crm/leads/${lead1.data.id}/promote`, {}, rm1.accessToken);
  check('prospect promoted (PROMOTED, promotedAt set)', promoted.status === 201 && promoted.data.status === 'PROMOTED' && !!promoted.data.promotedAt);
  const editPromoted = await patch(`/api/crm/leads/${lead1.data.id}`, { notes: 'x' }, rm1.accessToken);
  check('promoted lead read-only in CRM (400)', editPromoted.status === 400);
  const outboxRows = crm(`SELECT topic FROM outbox_event WHERE (payload->>'funderOrganizationId')::int = ${orgDId} OR payload->>'emailSubject' LIKE '%financing application%'`).split('\n').filter(Boolean);
  check('promotion wrote SEND_EMAIL + SLA_TIMER_START to outbox', outboxRows.includes('send_email') && outboxRows.includes('sla_timer_start'), outboxRows.join(','));

  // Cross-service loop: relay → Kafka → SLA engine timer
  const timer = await (async () => {
    const until = Date.now() + 30_000;
    for (;;) {
      const timers = await req(PC_BASE, 'GET', '/api/sla/timers', undefined, supervisor.accessToken);
      const match = (timers.data ?? []).find?.((t) => t.subjectType === 'LEAD' && t.subjectId === String(lead1.data.id));
      if (match || Date.now() > until) return match ?? null;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('SLA engine started the onboarding timer via real Kafka', !!timer && timer.status === 'RUNNING' && timer.slaCode === 'RM_ONBOARDING_RESPONSE', JSON.stringify(timer));

  // ── [4] Deals & kanban ──
  console.log('\n[4] Deals');
  const deal = await post('/api/crm/deals', {
    leadId: lead2.data.id,
    title: 'IF facility for Beta Traders',
    productCode: 'IF',
    dealValue: 250000,
    expectedCloseDate: '2026-09-30',
  }, rm1.accessToken);
  check('deal created at QUALIFIED', deal.status === 201 && deal.data.stage === 'QUALIFIED', JSON.stringify(deal.data));
  const rm2Deal = await patch(`/api/crm/deals/${deal.data.id}`, { stage: 'PROPOSAL' }, rm2.accessToken);
  check('deal update denied without crm_deals_manage (403)', rm2Deal.status === 403);
  const negotiation = await patch(`/api/crm/deals/${deal.data.id}`, { stage: 'NEGOTIATION' }, rm1.accessToken);
  check('stage move works', negotiation.status === 200 && negotiation.data.stage === 'NEGOTIATION');
  const won = await patch(`/api/crm/deals/${deal.data.id}`, { stage: 'WON' }, rm1.accessToken);
  check('WON closes the deal (closedAt set)', won.status === 200 && !!won.data.closedAt);
  const reopen = await patch(`/api/crm/deals/${deal.data.id}`, { stage: 'PROPOSAL' }, rm1.accessToken);
  check('closed deal cannot change stage (400)', reopen.status === 400);
  const historyCount = crm(`SELECT COUNT(*) FROM deal_stage_history WHERE "dealId" = ${deal.data.id}`);
  check('stage history append-only trail (3 rows)', historyCount === '3', historyCount);

  // ── [5] Supervisor assignment ──
  console.log('\n[5] Assignment');
  const lead3 = await post('/api/crm/leads', { companyName: 'Gamma Logistics' }, rm1.accessToken);
  const rm1Assign = await post(`/api/crm/leads/${lead3.data.id}/assign`, { rmPersonId: rm2PersonId }, rm1.accessToken);
  check('assign denied without crm_assignees_manage (403)', rm1Assign.status === 403);
  const assigned = await post(`/api/crm/leads/${lead3.data.id}/assign`, { rmPersonId: rm2PersonId }, supervisor.accessToken);
  check('supervisor reassigns lead owner', assigned.status === 201 && assigned.data.ownerRmPersonId === rm2PersonId);
  const rm2LeadsAfter = await get('/api/crm/leads', rm2.accessToken);
  check('assignment reflected in rm2 own queue', rm2LeadsAfter.data.some((l) => l.id === lead3.data.id));

  // ── [6] Site visits ──
  console.log('\n[6] Site visits');
  const visit = await post('/api/crm/site-visits', {
    leadId: lead2.data.id,
    visitedAt: '2026-07-20',
    summary: 'Warehouse operational, stock levels healthy',
  }, rm1.accessToken);
  check('site visit recorded', visit.status === 201);
  const rm2Visit = await post('/api/crm/site-visits', { visitedAt: '2026-07-20', summary: 'x' }, rm2.accessToken);
  check('site visit denied without onboarding_site_visits_manage (403)', rm2Visit.status === 403);
  const teamVisits = await get('/api/crm/site-visits?scope=team', supervisor.accessToken);
  check('supervisor sees team site visits', teamVisits.status === 200 && teamVisits.data.length === 1);

  // ── [7] Performance ──
  console.log('\n[7] RM performance');
  const rm1Perf = await get('/api/crm/performance', rm1.accessToken);
  check('performance denied without crm_supervisor_view (403)', rm1Perf.status === 403);
  const perf = await get('/api/crm/performance', supervisor.accessToken);
  const rm1Row = (perf.data ?? []).find((r) => r.rmPersonId === rm1PersonId);
  check(
    'per-RM funnel metrics computed',
    perf.status === 200 && rm1Row && rm1Row.leads === 2 && rm1Row.promoted === 1 && rm1Row.dealsWon === 1 && rm1Row.winRate === 1,
    JSON.stringify(rm1Row),
  );

  // ── [8] Tenant isolation ──
  console.log('\n[8] Tenant isolation');
  const org2Team = await get('/api/crm/leads?scope=team', org2Admin.accessToken);
  check('org 2 admin sees none of Org D leads', org2Team.status === 200 && !(org2Team.data ?? []).some((l) => l.funderOrganizationId === orgDId));

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
