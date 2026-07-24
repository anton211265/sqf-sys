// E2E — Operations Hub pass 1 (continues the pass-2 journey): ILO view (sanitized), passkey e-signature
// acceptance (fresh assertion -> esign JWT bound to the terms hash),
// decline/tamper negatives, registration fee -> CLIENT_ONBOARDED over real
// Kafka -> trade-directory fullyOnboardedAt + CRM My Clients projection.
//   node apps/trade-directory/src/scripts/e2e-operations.mjs
import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { SoftAuthenticator, sha256 } from './lib/soft-authenticator.mjs';

const TD = 'http://localhost/trade-directory';
const RO = 'http://localhost/risk-operation';
const CRM = 'http://localhost/customer-relationship-management';
const ORIGIN = 'http://localhost:3003';
const ORG2 = 2;
const ORG_Z = 'E2E Ops Client Sdn Bhd';
const CLIENT_EMAIL = 'finance@e2e-ops-client.example';
const STAFF = ['e2e-ops-admin@test.local', 'e2e-ops-op2@test.local', 'e2e-ops-om@test.local'];

let passed = 0, failed = 0;
const check = (n, c, d = '') => { if (c) { passed++; console.log(`  ✓ ${n}`); } else { failed++; console.error(`  ✗ ${n} ${d}`); } };
const psql = (db, sql) => execSync(`docker compose exec -T postgres psql -U postgres -d ${JSON.stringify(db)} -tAc ${JSON.stringify(sql.replace(/\s+/g, ' ').trim())}`, { cwd: process.cwd(), encoding: 'utf8' }).trim();
const td = (s) => psql('trade-directory', s);
const ro = (s) => psql('risk-operation', s);
const crm = (s) => psql('customer-relationship-management', s);

async function req(base, method, path, body, token) {
  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function login(email, orgId) {
  const auth = new SoftAuthenticator();
  const raw = randomBytes(48).toString('base64url');
  td(`INSERT INTO enrollment_token ("personId","tokenHash","expiresAt") SELECT id, '${sha256(raw).toString('hex')}', LOCALTIMESTAMP + interval '1 hour' FROM person WHERE email='${email}'`);
  const reg = await req(TD, 'POST', '/auth/passkey/register-options', { enrollmentToken: raw });
  await req(TD, 'POST', '/auth/passkey/register-verify', { registrationSessionId: reg.data.registrationSessionId, response: auth.makeRegistrationResponse(reg.data.options.challenge) });
  const lo = await req(TD, 'POST', '/auth/passkey/login-options', { email, orgId });
  const lv = await req(TD, 'POST', '/auth/passkey/login-verify', { loginSessionId: lo.data.loginSessionId, response: auth.makeAssertionResponse(lo.data.options.challenge) });
  if (!lv.data?.accessToken) throw new Error(`login failed ${email}`);
  return { token: lv.data.accessToken, authenticator: auth };
}

function teardown() {
  const orgZ = td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_Z}'`);
  const appId = ro(`SELECT id FROM application WHERE "applicationNumber"='E2EOPS_APP'`);
  if (appId) {
    ro(`DELETE FROM offer_acceptance WHERE application_id = ${appId}`);
    ro(`DELETE FROM provisional_offer WHERE application_id = ${appId}`);
    ro(`DELETE FROM risk_audit_log WHERE (payload->>'applicationId')::int = ${appId}`);
    ro(`DELETE FROM application WHERE id = ${appId}`);
    crm(`DELETE FROM applicant_intake WHERE "applicationId" = ${appId}`);
  }
  if (orgZ) {
    const caseIds = td(`SELECT string_agg(id::text, ',') FROM operations_case WHERE "organizationId" = ${orgZ}`);
    td(`DELETE FROM contract WHERE "secondPartyOrganizationId" = ${orgZ}`);
    td(`DELETE FROM operations_case WHERE "organizationId" = ${orgZ}`);
    if (caseIds) td(`DELETE FROM outbox_event WHERE payload->>'subjectType' = 'OPERATIONS_CASE' AND payload->>'subjectId' IN (${caseIds.split(',').map((x) => `'${x}'`).join(',')})`);
  }
  const emails = [CLIENT_EMAIL, ...STAFF].map((e) => `'${e}'`).join(',');
  for (const t of ['enrollment_token', 'webauthn_credential', 'token', 'person_role', 'organization_person']) {
    td(`DELETE FROM ${t} WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  }
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  td(`DELETE FROM organization_role WHERE name IN ('E2E Ops Op2','E2E Ops OM') AND "organizationId"=${ORG2}`);
  if (orgZ) td(`DELETE FROM organization WHERE id = ${orgZ}`);
}

async function main() {
  teardown();
  // org Z (applicant) + client person
  td(`INSERT INTO organization ("organizationName", country) VALUES ('${ORG_Z}', 'MY')`);
  const orgZ = parseInt(td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_Z}'`), 10);
  td(`INSERT INTO person (name, email) VALUES ('P2 Client', '${CLIENT_EMAIL}')`);
  td(`INSERT INTO organization_person ("organizationId","personId",designation) SELECT ${orgZ}, id, 'Applicant Contact' FROM person WHERE email='${CLIENT_EMAIL}'`);
  // staff
  const grant = (role, keys) => {
    td(`INSERT INTO organization_role (name, "isImmutable", "organizationId") VALUES ('${role}', false, ${ORG2})`);
    for (const k of keys) td(`INSERT INTO role_permission ("roleId","permissionId") SELECT r.id, p.id FROM organization_role r, permission p WHERE r.name='${role}' AND r."organizationId"=${ORG2} AND p."permKey"='${k}'`);
  };
  grant('E2E Ops Op2', ['risk_offers_view', 'risk_offers_check', 'ops_queue_view', 'ops_agreements_check']);
  grant('E2E Ops OM', ['risk_offers_view', 'risk_offers_approve', 'risk_offers_resolve', 'ops_queue_view', 'ops_agreements_approve']);
  for (const [email, roleSql] of [
    [STAFF[0], `SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${STAFF[0]}' AND r."organizationId"=${ORG2} AND r."isImmutable"=true`],
    [STAFF[1], `SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${STAFF[1]}' AND r.name='E2E Ops Op2' AND r."organizationId"=${ORG2}`],
    [STAFF[2], `SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${STAFF[2]}' AND r.name='E2E Ops OM' AND r."organizationId"=${ORG2}`],
  ]) {
    td(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}','${email}')`);
    td(`INSERT INTO organization_person ("organizationId","personId",designation) SELECT ${ORG2}, id, 'E2E' FROM person WHERE email='${email}'`);
    td(`INSERT INTO person_role ("personId","roleId") ${roleSql}`);
  }
  const admin = (await login(STAFF[0], ORG2)).token;
  const cra2 = (await login(STAFF[1], ORG2)).token;
  const cm = (await login(STAFF[2], ORG2)).token;

  // application + offer chain to SENT
  ro(`INSERT INTO application ("organizationId","clientOrganizationName","applicationStatus","applicationNumber","funderOrganizationId","productCode","applicationPayload") VALUES (${orgZ},'${ORG_Z}','SCORED_PASS','E2EOPS_APP',${ORG2},'AR','{}')`);
  const appId = parseInt(ro(`SELECT id FROM application WHERE "applicationNumber"='E2EOPS_APP'`), 10);
  crm(`INSERT INTO applicant_intake ("funderOrganizationId","applicationId","applicationNumber","organizationId","companyName","productCode","result") VALUES (${ORG2},${appId},'E2EOPS_APP',${orgZ},'${ORG_Z}','AR','PASS')`);
  const offer = await req(RO, 'POST', '/api/offers', { applicationId: appId }, admin);
  const oid = offer.data.id;
  await req(RO, 'PUT', `/api/offers/${oid}`, { inputs: { unexpiredContractValue: 1200000, tenureMonths: 6, advanceRate: 0.8, adminFeeRate: 0.01, creditPeriodDays: 60, profitRatePa: 0.12, collectionPeriodMonths: 2, processingFeeOnApplication: 1000, remittanceFeePerInvoice: 40, dayCountBase: 360 } }, admin);
  await req(RO, 'POST', `/api/offers/${oid}/submit`, {}, admin);
  await req(RO, 'POST', `/api/offers/${oid}/check`, {}, cra2);
  const sent = await req(RO, 'POST', `/api/offers/${oid}/approve`, {}, cm);
  check('offer chain reaches SENT', sent.status === 201 && sent.data.status === 'SENT');

  // ── [1] Client views the ILO ──
  console.log('\n[1] Client ILO view');
  const client = await login(CLIENT_EMAIL, orgZ);
  const view = await req(RO, 'GET', '/api/portal/offer', undefined, client.token);
  check('client sees sanitized terms (no internal outputs)',
    view.status === 200 && view.data.terms?.keyTerms?.advanceRate === 0.8 &&
    view.data.termsSha256?.length === 64 && view.data.outputs === undefined,
    JSON.stringify(view.data).slice(0, 120));
  const HASH = view.data.termsSha256;

  // ── [2] Acceptance negatives ──
  console.log('\n[2] Negatives');
  const noSign = await req(RO, 'POST', '/api/portal/offer/respond', { decision: 'accept', termsSha256: HASH }, client.token);
  check('accept without e-signature rejected (400)', noSign.status === 400);
  const tampered = await req(RO, 'POST', '/api/portal/offer/respond', { decision: 'accept', termsSha256: 'a'.repeat(64), esignToken: 'x' }, client.token);
  check('tampered terms hash rejected (400)', tampered.status === 400);

  // esign bound to the WRONG hash must fail at respond
  const reauth1 = await req(TD, 'POST', '/auth/passkey/reauth-options', {}, client.token);
  const wrongSign = await req(TD, 'POST', '/auth/passkey/esign-verify', {
    reauthSessionId: reauth1.data.reauthSessionId,
    response: client.authenticator.makeAssertionResponse(reauth1.data.options.challenge),
    docSha256: 'b'.repeat(64),
  }, client.token);
  check('esign ceremony issues a token after fresh assertion', wrongSign.status === 201 && !!wrongSign.data.esignToken);
  const mismatch = await req(RO, 'POST', '/api/portal/offer/respond', { decision: 'accept', termsSha256: HASH, esignToken: wrongSign.data.esignToken }, client.token);
  check('esign bound to a different document rejected (401)', mismatch.status === 401);

  // ── [3] Passkey e-signature acceptance ──
  console.log('\n[3] E-signature acceptance');
  const reauth2 = await req(TD, 'POST', '/auth/passkey/reauth-options', {}, client.token);
  const sign = await req(TD, 'POST', '/auth/passkey/esign-verify', {
    reauthSessionId: reauth2.data.reauthSessionId,
    response: client.authenticator.makeAssertionResponse(reauth2.data.options.challenge),
    docSha256: HASH,
  }, client.token);
  const accepted = await req(RO, 'POST', '/api/portal/offer/respond', { decision: 'accept', termsSha256: HASH, esignToken: sign.data.esignToken }, client.token);
  check('signed acceptance recorded (ACCEPTED, next step fee)',
    accepted.status === 201 && accepted.data.status === 'ACCEPTED' && accepted.data.nextStep === 'REGISTRATION_FEE',
    JSON.stringify(accepted.data));
  const record = ro(`SELECT decision || '|' || terms_sha256 || '|' || (credential_id <> '') FROM offer_acceptance WHERE offer_id = ${oid}`);
  check('acceptance evidence row (hash + credential id)', record === `ACCEPTED|${HASH}|true`, record);
  const cancelQueued = ro(`SELECT COUNT(*) FROM outbox_event WHERE topic='sla_timer_cancel' AND payload->>'subjectId'='${oid}'`);
  check('acceptance cancels the acceptance SLA', parseInt(cancelQueued, 10) >= 1, cancelQueued);
  const again = await req(RO, 'POST', '/api/portal/offer/respond', { decision: 'decline', termsSha256: HASH }, client.token);
  check('offer no longer open after acceptance (400)', again.status === 400);

  // ── [4] Registration fee -> Applicant becomes Client (real Kafka) ──
  console.log('\n[4] Registration fee & CLIENT_ONBOARDED');
  const cra2Fee = await req(RO, 'POST', `/api/offers/${oid}/confirm-fee`, {}, cra2);
  check('fee confirm denied without risk_offers_resolve (403)', cra2Fee.status === 403);
  const fee = await req(RO, 'POST', `/api/offers/${oid}/confirm-fee`, {}, cm);
  check('fee confirmed -> non-active client', fee.status === 201 && fee.data.clientStatus === 'NON_ACTIVE_CLIENT');
  const feeTwice = await req(RO, 'POST', `/api/offers/${oid}/confirm-fee`, {}, cm);
  check('double fee confirmation rejected (400)', feeTwice.status === 400);

  const onboarded = await (async () => {
    const until = Date.now() + 30000;
    for (;;) {
      const stamped = td(`SELECT ("fullyOnboardedAt" IS NOT NULL)::text FROM organization WHERE id = ${orgZ}`);
      const crmFlag = crm(`SELECT ("clientOnboardedAt" IS NOT NULL)::text FROM applicant_intake WHERE "applicationId" = ${appId}`);
      if ((stamped === 'true' && crmFlag === 'true') || Date.now() > until) return { stamped, crmFlag };
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('trade-directory stamps fullyOnboardedAt via Kafka', onboarded.stamped === 'true', JSON.stringify(onboarded));
  check('CRM My Clients projection flagged via Kafka', onboarded.crmFlag === 'true');
  const clientsList = await req(CRM, 'GET', '/api/crm/applicants-web/clients', undefined, admin);
  check('My Clients endpoint lists the onboarded client',
    clientsList.status === 200 && (clientsList.data ?? []).some((c) => c.applicationId === appId));

  // ── [5] Operations case queued via Kafka ──
  console.log('\n[5] Operations case (CLIENT_ONBOARDED consumer)');
  const caseId = await (async () => {
    const until = Date.now() + 30000;
    for (;;) {
      const id = td(`SELECT id FROM operations_case WHERE "organizationId" = ${orgZ} AND status = 'NEW'`);
      if (id || Date.now() > until) return id ? parseInt(id, 10) : null;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('case queued NEW with the accepted key terms', !!caseId &&
    td(`SELECT ("agreementTerms"->>'advanceRate') FROM operations_case WHERE id = ${caseId}`) === '0.8');

  // ── [6] Operator maker/checker/OM chain ──
  console.log('\n[6] Agreement chain');
  const op2Pickup = await req(TD, 'POST', `/api/operations/cases/${caseId}/pickup`, {}, cra2);
  check('pickup denied without ops_agreements_manage (403)', op2Pickup.status === 403);
  const picked = await req(TD, 'POST', `/api/operations/cases/${caseId}/pickup`, {}, admin);
  check('operator pickup renders the pack (sha256 present)',
    picked.status === 201 && picked.data.status === 'IN_PREPARATION' && picked.data.agreementSha256?.length === 64);
  await req(TD, 'POST', `/api/operations/cases/${caseId}/submit`, {}, admin);
  const selfCheck = await req(TD, 'POST', `/api/operations/cases/${caseId}/check`, {}, admin);
  check('preparing operator cannot self-check (403)', selfCheck.status === 403);
  const checked = await req(TD, 'POST', `/api/operations/cases/${caseId}/check`, {}, cra2);
  check('second operator verifies -> CHECKED', checked.status === 201 && checked.data.status === 'CHECKED');
  const makerApproveOps = await req(TD, 'POST', `/api/operations/cases/${caseId}/approve`, {}, admin);
  check('maker cannot OM-approve own pack (403)', makerApproveOps.status === 403);
  const approvedOps = await req(TD, 'POST', `/api/operations/cases/${caseId}/approve`, {}, cm);
  check('OM approves -> PENDING_SIGNATURE + signature SLA queued',
    approvedOps.status === 201 && approvedOps.data.status === 'PENDING_SIGNATURE' &&
    td(`SELECT COUNT(*) FROM outbox_event WHERE topic='sla_timer_start' AND payload->>'slaCode'='CLIENT_AGREEMENT_SIGNATURE' AND payload->>'subjectId'='${caseId}'`) === '1');

  // ── [7] Client executes with passkey ──
  console.log('\n[7] Client signature -> facility in force');
  const agreementView = await req(TD, 'GET', '/portal/agreement', undefined, client.token);
  check('client sees the pack + hash', agreementView.status === 200 && agreementView.data.agreementSha256?.length === 64);
  const packHash = agreementView.data.agreementSha256;
  const badSign = await req(TD, 'POST', '/portal/agreement/sign', { esignToken: sign.data.esignToken }, client.token);
  check('esign bound to the ILO (different doc) rejected (401)', badSign.status === 401);
  const reauth3 = await req(TD, 'POST', '/auth/passkey/reauth-options', {}, client.token);
  const packSign = await req(TD, 'POST', '/auth/passkey/esign-verify', {
    reauthSessionId: reauth3.data.reauthSessionId,
    response: client.authenticator.makeAssertionResponse(reauth3.data.options.challenge),
    docSha256: packHash,
  }, client.token);
  const executed = await req(TD, 'POST', '/portal/agreement/sign', { esignToken: packSign.data.esignToken }, client.token);
  check('agreement executed -> FACILITY_AGREEMENT contract created',
    executed.status === 201 && executed.data.status === 'EXECUTED' && Number.isInteger(executed.data.contractId));
  const contractRow = td(`SELECT "contractType" || '|' || "lendingProduct" || '|' || "secondPartyOrganizationId" FROM contract WHERE id = ${executed.data.contractId}`);
  check('contract row: FACILITY_AGREEMENT / AR_FINANCE / client org',
    contractRow === `FACILITY_AGREEMENT|AR_FINANCE|${orgZ}`, contractRow);
  const upsertQueued = td(`SELECT COUNT(*) FROM outbox_event WHERE topic='contract_upserted' AND (payload->>'id')::int = ${executed.data.contractId}`);
  check('CONTRACT_UPSERTED queued (knowledge graph projection)', upsertQueued === '1', upsertQueued);
  const evidence = td(`SELECT ("signedCredentialId" <> '') || '|' || ("signatureIp" IS NOT NULL) FROM operations_case WHERE id = ${caseId}`);
  check('signature evidence recorded (credential + IP)', evidence === 'true|true', evidence);
  const signAgain = await req(TD, 'POST', '/portal/agreement/sign', { esignToken: packSign.data.esignToken }, client.token);
  check('no re-signing after execution (404)', signAgain.status === 404);

  // client portal reflects the fee
  const finalView = await req(RO, 'GET', '/api/portal/offer', undefined, client.token);
  check('client sees ACCEPTED + fee confirmed', finalView.data.status === 'ACCEPTED' && !!finalView.data.registrationFeeConfirmedAt);

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  teardown();
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error('crashed:', e); try { teardown(); } catch {} process.exit(1); });
