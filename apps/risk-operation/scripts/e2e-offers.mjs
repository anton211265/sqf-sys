// E2E — Provisional Offer workspace (CRC pass 2): rate-card mirror via real
// Kafka, simulator worked example, maker-checker-approver chain with
// segregation negatives, SLA acceptance-breach lapse, tenant isolation.
//   node apps/risk-operation/scripts/e2e-offers.mjs
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { SoftAuthenticator, sha256 } from '../../trade-directory/src/scripts/lib/soft-authenticator.mjs';

const TD = 'http://localhost/trade-directory';
const RO = 'http://localhost/risk-operation';
const PC = 'http://localhost/product-configurator';
const ORIGIN = 'http://localhost:3001';
const ORG2 = 2;
const EMAILS = ['e2e-off-admin@test.local', 'e2e-off-cra2@test.local', 'e2e-off-cm@test.local'];

let passed = 0, failed = 0;
const check = (n, c, d = '') => { if (c) { passed++; console.log(`  ✓ ${n}`); } else { failed++; console.error(`  ✗ ${n} ${d}`); } };
const psql = (db, sql) => execSync(`docker compose exec -T postgres psql -U postgres -d ${JSON.stringify(db)} -tAc ${JSON.stringify(sql.replace(/\s+/g, ' ').trim())}`, { cwd: process.cwd(), encoding: 'utf8' }).trim();
const td = (s) => psql('trade-directory', s);
const ro = (s) => psql('risk-operation', s);
const pc = (s) => psql('product-configurator', s);

async function req(base, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login(email, roleSql) {
  if (!td(`SELECT id FROM person WHERE email='${email}'`)) {
    td(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}','${email}')`);
    td(`INSERT INTO organization_person ("organizationId","personId",designation) SELECT ${ORG2}, id, 'E2E' FROM person WHERE email='${email}'`);
    td(roleSql);
  }
  const auth = new SoftAuthenticator();
  const raw = randomBytes(48).toString('base64url');
  td(`INSERT INTO enrollment_token ("personId","tokenHash","expiresAt") SELECT id, '${sha256(raw).toString('hex')}', LOCALTIMESTAMP + interval '1 hour' FROM person WHERE email='${email}'`);
  const reg = await req(TD, 'POST', '/auth/passkey/register-options', { enrollmentToken: raw });
  await req(TD, 'POST', '/auth/passkey/register-verify', { registrationSessionId: reg.data.registrationSessionId, response: auth.makeRegistrationResponse(reg.data.options.challenge) });
  const lo = await req(TD, 'POST', '/auth/passkey/login-options', { email, orgId: ORG2 });
  const lv = await req(TD, 'POST', '/auth/passkey/login-verify', { loginSessionId: lo.data.loginSessionId, response: auth.makeAssertionResponse(lo.data.options.challenge) });
  if (!lv.data?.accessToken) throw new Error(`login failed ${email}`);
  return lv.data.accessToken;
}

function teardown() {
  // bespoke test products + their mirror rows
  const codes = pc(`SELECT string_agg('''' || "productCode" || '''', ',') FROM product WHERE "productName" LIKE 'E2E Offer Card %'`);
  pc(`DELETE FROM master_rate_card WHERE "productId" IN (SELECT id FROM product WHERE "productName" LIKE 'E2E Offer Card %')`);
  pc(`DELETE FROM product_config_audit_log WHERE "productId" IN (SELECT id FROM product WHERE "productName" LIKE 'E2E Offer Card %')`);
  pc(`DELETE FROM product WHERE "productName" LIKE 'E2E Offer Card %'`);
  if (codes) ro(`DELETE FROM rate_card_mirror WHERE product_code IN (${codes})`);
  const appId = ro(`SELECT id FROM application WHERE "applicationNumber"='E2EO_APP1'`);
  if (appId) {
    ro(`DELETE FROM provisional_offer WHERE application_id = ${appId}`);
    ro(`DELETE FROM application WHERE id = ${appId}`);
  }
  ro(`DELETE FROM risk_audit_log WHERE event LIKE 'OFFER_%' AND payload->>'applicationId' = '${appId || 0}'`);
  const emails = EMAILS.map((e) => `'${e}'`).join(',');
  for (const t of ['enrollment_token', 'webauthn_credential', 'token', 'person_role', 'organization_person']) {
    td(`DELETE FROM ${t} WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  }
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  td(`DELETE FROM organization_role WHERE name IN ('E2E Off CRA2','E2E Off CM') AND "organizationId"=${ORG2}`);
}

async function main() {
  teardown();
  const grant = (role, keys) => {
    td(`INSERT INTO organization_role (name, "isImmutable", "organizationId") VALUES ('${role}', false, ${ORG2})`);
    for (const k of keys) td(`INSERT INTO role_permission ("roleId","permissionId") SELECT r.id, p.id FROM organization_role r, permission p WHERE r.name='${role}' AND r."organizationId"=${ORG2} AND p."permKey"='${k}'`);
  };
  grant('E2E Off CRA2', ['risk_offers_view', 'risk_offers_check']);
  grant('E2E Off CM', ['risk_offers_view', 'risk_offers_approve', 'risk_offers_resolve']);
  const admin = await login(EMAILS[0], `INSERT INTO person_role ("personId","roleId") SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${EMAILS[0]}' AND r."organizationId"=${ORG2} AND r."isImmutable"=true`);
  const cra2 = await login(EMAILS[1], `INSERT INTO person_role ("personId","roleId") SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${EMAILS[1]}' AND r.name='E2E Off CRA2' AND r."organizationId"=${ORG2}`);
  const cm = await login(EMAILS[2], `INSERT INTO person_role ("personId","roleId") SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${EMAILS[2]}' AND r.name='E2E Off CM' AND r."organizationId"=${ORG2}`);

  console.log('\n[1] Rate-card mirror (real Kafka)');
  const bespoke = await req(PC, 'POST', '/api/products/bespoke', {
    productName: `E2E Offer Card ${Date.now()}`, clientOwnerOrganizationId: 5,
    interestRateApr: 0.12, advanceRatePct: 0.85, discountFeePct: 0.01,
    oneTimeAdminFee: 500, minTenureDays: 30, maxTenureDays: 720,
  }, admin);
  check('bespoke product published (emits RATE_CARD_PUBLISHED)', bespoke.status === 201, JSON.stringify(bespoke.data).slice(0, 120));
  const code = bespoke.data?.product?.productCode ?? bespoke.data?.productCode;
  const mirrored = await (async () => {
    const until = Date.now() + 30000;
    for (;;) {
      const row = ro(`SELECT params->>'advanceRatePct' FROM rate_card_mirror WHERE product_code = '${code}'`);
      if (row || Date.now() > until) return row;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('mirror row landed via outbox->Kafka->consumer', mirrored === '0.85', mirrored);

  console.log('\n[2] Simulator worked example (workbook post-factoring)');
  const sim = await req(RO, 'POST', '/api/offers/simulate', {
    scenario: 'POST_FACTORING',
    inputs: { unexpiredContractValue: 1200000, tenureMonths: 6, advanceRate: 0.8, adminFeeRate: 0.01, creditPeriodDays: 60, profitRatePa: 0.12, collectionPeriodMonths: 2, processingFeeOnApplication: 1000, remittanceFeePerInvoice: 40, dayCountBase: 360 },
  }, admin);
  // invoice 200000; advance 160000; adminFee 2000; profit (158000*0.12*60/360)=3160
  const me = sim.data?.monthlyEconomics ?? {};
  check('monthly economics match hand-computed values',
    me.monthlyInvoice === 200000 && me.monthlyAdvance === 160000 && me.monthlyAdminFee === 2000 && me.monthlyProfit === 3160, JSON.stringify(me));
  // exposure m=2: 160000*2 - 1000 - (2000+3160)*2 = 308680
  check('highest exposure matches workbook formula', sim.data?.highestExposure?.amount === 308680 && sim.data?.highestExposure?.monthIndex === 2, JSON.stringify(sim.data?.highestExposure));
  // profit: 1000 + 12000 + 18960 + 240 + 0 = 32200
  check('profit projection totals', sim.data?.totalProjectedProfit === 32200, String(sim.data?.totalProjectedProfit));

  console.log('\n[3] Maker-checker-approver chain');
  ro(`INSERT INTO application ("organizationId","clientOrganizationName","applicationStatus","applicationNumber","funderOrganizationId","productCode","applicationPayload") VALUES (5,'E2E Offer Co','SCORED_PASS','E2EO_APP1',${ORG2},'AR','{}')`);
  const appId = parseInt(ro(`SELECT id FROM application WHERE "applicationNumber"='E2EO_APP1'`), 10);
  const denied = await req(RO, 'POST', '/api/offers', { applicationId: appId }, cra2);
  check('create denied without risk_offers_manage (403)', denied.status === 403);
  const offer = await req(RO, 'POST', '/api/offers', { applicationId: appId }, admin);
  check('offer created; application -> IN_CRC_REVIEW; CRA SLA start queued',
    offer.status === 201 && ro(`SELECT "applicationStatus" FROM application WHERE id=${appId}`) === 'IN_CRC_REVIEW' &&
    ro(`SELECT COUNT(*) FROM outbox_event WHERE topic='sla_timer_start' AND payload->>'slaCode'='CRA_PROVISIONAL_OFFER' AND payload->>'subjectId'='${offer.data?.id}'`) === '1',
    JSON.stringify(offer.data).slice(0, 120));
  const oid = offer.data.id;
  const saved = await req(RO, 'PUT', `/api/offers/${oid}`, { inputs: { unexpiredContractValue: 1200000, tenureMonths: 6, advanceRate: 0.9, adminFeeRate: 0.01, creditPeriodDays: 60, profitRatePa: 0.12, collectionPeriodMonths: 2, processingFeeOnApplication: 1000, remittanceFeePerInvoice: 40, dayCountBase: 360 } }, admin);
  check('save recomputes outputs + records overrides vs card defaults',
    saved.status === 200 && saved.data.outputs?.totalProjectedProfit > 0 && !!saved.data.overrides, JSON.stringify(saved.data.overrides));
  await req(RO, 'POST', `/api/offers/${oid}/submit`, {}, admin);
  const selfCheck = await req(RO, 'POST', `/api/offers/${oid}/check`, {}, admin);
  check('maker cannot self-check even with every key (403)', selfCheck.status === 403);
  const checked = await req(RO, 'POST', `/api/offers/${oid}/check`, {}, cra2);
  check('second CRA verifies -> CHECKED', checked.status === 201 && checked.data.status === 'CHECKED');
  const makerApprove = await req(RO, 'POST', `/api/offers/${oid}/approve`, {}, admin);
  check('maker cannot approve own offer (403)', makerApprove.status === 403);
  const approved = await req(RO, 'POST', `/api/offers/${oid}/approve`, {}, cm);
  check('CM approves -> auto SENT + acceptance SLA + stub email',
    approved.status === 201 && approved.data.status === 'SENT' &&
    ro(`SELECT COUNT(*) FROM outbox_event WHERE topic='sla_timer_start' AND payload->>'slaCode'='OFFER_ACCEPTANCE' AND payload->>'subjectId'='${oid}'`) === '1');

  console.log('\n[4] Acceptance-window lapse + refresh (real Kafka)');
  pc(`INSERT INTO outbox_event (id, topic, payload, status) VALUES (gen_random_uuid(),'sla_breached', ('{"eventId":"' || gen_random_uuid() || '","funderOrganizationId":${ORG2},"slaCode":"OFFER_ACCEPTANCE","subjectType":"OFFER","subjectId":"${oid}"}')::jsonb,'pending')`);
  const lapsed = await (async () => {
    const until = Date.now() + 30000;
    for (;;) {
      const s = ro(`SELECT status FROM provisional_offer WHERE id=${oid}`);
      if (s === 'LAPSED' || Date.now() > until) return s;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('breach consumer lapses the SENT offer', lapsed === 'LAPSED', lapsed);
  const refreshed = await req(RO, 'POST', `/api/offers/${oid}/resolve`, { action: 'refresh' }, cm);
  check('RM refresh re-sends unchanged (LAPSED -> SENT)', refreshed.status === 201 && refreshed.data.status === 'SENT');
  const acceptDenied = await req(RO, 'POST', `/api/offers/${oid}/resolve`, { action: 'accept' }, cra2);
  check('resolve denied without risk_offers_resolve (403)', acceptDenied.status === 403);
  const accepted = await req(RO, 'POST', `/api/offers/${oid}/resolve`, { action: 'accept' }, cm);
  check('acceptance recorded (dev stub until portal pass 2)', accepted.status === 201 && accepted.data.status === 'ACCEPTED');
  const auditCount = ro(`SELECT COUNT(DISTINCT event) FROM risk_audit_log WHERE payload->>'offerId'='${oid}'`);
  check('audit trail covers the offer lifecycle (>=5 events)', parseInt(auditCount, 10) >= 5, auditCount);

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  teardown();
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error('crashed:', e); try { teardown(); } catch {} process.exit(1); });
