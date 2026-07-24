// E2E test for Customer Portal pass 1 — the onboarding funnel end-to-end:
// public config, disclaimer acceptance + self-registration (policy denies),
// passkey enroll/login, wizard draft saves, real document uploads (MinIO),
// bank-country policy, submit -> Filter-1 scoring -> APPLICATION_SCORED via
// real Kafka -> CRM supervisor queue projection + assignment, CRC bucket,
// RM fail->pass override, and the SLA_BREACHED close path. No mocks beyond
// the sanctioned eKYC mock provider.
//
//   node apps/customer-portal/scripts/e2e-portal-onboarding.mjs
//
// Applicants are script-created; funder = org 2 (dev binding, approved
// annotation Q6). Requires Node >= 22.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  SoftAuthenticator,
  sha256,
} from '../../trade-directory/src/scripts/lib/soft-authenticator.mjs';

const TD = 'http://localhost/trade-directory';
const RO = 'http://localhost/risk-operation';
const CRM = 'http://localhost/customer-relationship-management';
const PC = 'http://localhost/product-configurator';
const DM = 'http://localhost/document-management';
const ORIGIN = 'http://localhost:3003';
const ORG2 = 2;
const COMPANY = 'E2E Portal Applicant Sdn Bhd';
const COMPANY_BRN = 'E2E-PORTAL-001';
const APPLICANT_EMAIL = 'finance@e2e-portal-applicant.example';
const ADMIN_EMAIL = 'e2e-portal-admin@test.local';

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
const ro = (sql) => psql('risk-operation', sql);
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

async function uploadCsv(token, documentClass, orgId, fileName, content) {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/csv' }), fileName);
  form.append('documentClass', documentClass);
  form.append('subjectOrganizationId', String(orgId));
  const res = await fetch(`${DM}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
    body: form,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function loginWithFreshCredential(email, orgId) {
  const authenticator = new SoftAuthenticator();
  const raw = randomBytes(48).toString('base64url');
  td(
    `INSERT INTO enrollment_token ("personId", "tokenHash", "expiresAt")
     SELECT id, '${sha256(raw).toString('hex')}', LOCALTIMESTAMP + interval '1 hour'
     FROM person WHERE email = '${email}'`,
  );
  const reg = await req(TD, 'POST', '/auth/passkey/register-options', { enrollmentToken: raw });
  await req(TD, 'POST', '/auth/passkey/register-verify', {
    registrationSessionId: reg.data.registrationSessionId,
    response: authenticator.makeRegistrationResponse(reg.data.options.challenge),
  });
  const lo = await req(TD, 'POST', '/auth/passkey/login-options', { email, orgId });
  const lv = await req(TD, 'POST', '/auth/passkey/login-verify', {
    loginSessionId: lo.data.loginSessionId,
    response: authenticator.makeAssertionResponse(lo.data.options.challenge),
  });
  if (!lv.data?.accessToken) throw new Error(`login failed ${email}: ${JSON.stringify(lv.data)}`);
  return lv.data.accessToken;
}

function teardown() {
  const orgId = td(`SELECT id FROM organization WHERE "organizationName" = '${COMPANY}'`);
  const emails = `'${APPLICANT_EMAIL}','${ADMIN_EMAIL}'`;
  if (orgId) {
    const appIds = ro(`SELECT string_agg(id::text, ',') FROM application WHERE "organizationId" = ${orgId} OR "applicationNumber" LIKE 'E2EP_%'`);
    if (appIds) {
      ro(`DELETE FROM risk_quantitative_profile_scoring WHERE risk_application_scoring_id IN (SELECT id FROM risk_application_scoring WHERE "applicationId" IN (${appIds}))`);
      ro(`DELETE FROM risk_application_scoring WHERE "applicationId" IN (${appIds})`);
      ro(`DELETE FROM application WHERE id IN (${appIds})`);
    }
    ro(`DELETE FROM financial_credit_report WHERE organization_id = ${orgId}`);
    ro(`DELETE FROM risk_audit_log WHERE (payload->>'funderOrganizationId')::int = ${ORG2} AND payload->>'applicationId' IS NOT NULL AND (payload->>'applicationId')::int IN (${appIds || '0'})`);
    crm(`DELETE FROM applicant_intake WHERE "organizationId" = ${orgId} OR "applicationNumber" LIKE 'E2EP_%'`);
  }
  ro(`DELETE FROM application WHERE "applicationNumber" LIKE 'E2EP_%'`);
  crm(`DELETE FROM applicant_intake WHERE "applicationNumber" LIKE 'E2EP_%'`);
  td(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person_role WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM disclaimer_acceptance WHERE email IN (${emails})`);
  td(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  if (orgId) td(`DELETE FROM organization WHERE id = ${orgId}`);
  td(`DELETE FROM outbox_event WHERE payload->>'emailReceivers' LIKE '%e2e-portal%'`);
}

async function main() {
  process.stdout.write('Waiting for services');
  for (const base of [TD, RO, CRM, PC, DM]) {
    for (let i = 0; i < 30; i += 1) {
      try {
        const res = await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) });
        if (res.status === 404) break;
      } catch {
        /* not up */
      }
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  console.log(' ready.');
  teardown();

  // org-2 funder admin (immutable role holder) for the funder-side checks
  td(`INSERT INTO person (name, email) VALUES ('portal-e2e-admin', '${ADMIN_EMAIL}')`);
  td(`INSERT INTO organization_person ("organizationId","personId",designation) SELECT ${ORG2}, id, 'E2E' FROM person WHERE email='${ADMIN_EMAIL}'`);
  td(`INSERT INTO person_role ("personId","roleId") SELECT p.id, r.id FROM person p, organization_role r WHERE p.email='${ADMIN_EMAIL}' AND r."organizationId"=${ORG2} AND r."isImmutable"=true`);
  const admin = await loginWithFreshCredential(ADMIN_EMAIL, ORG2);

  // ── [1] Public onboarding config ──
  console.log('\n[1] Public onboarding config');
  const config = await req(PC, 'GET', '/api/public/onboarding-config');
  check('config served (disclaimer + policies + products)',
    config.status === 200 && config.data.disclaimer?.hash?.length === 64 &&
    config.data.corporateEmailMode === 'BLOCK' && config.data.activeProducts?.length >= 4,
    JSON.stringify({ status: config.status }));
  const HASH = config.data.disclaimer.hash;

  // ── [2] Registration policies ──
  console.log('\n[2] Self-registration');
  const base = {
    contactName: 'Priya Applicant', companyName: COMPANY,
    businessRegistrationNumber: COMPANY_BRN, country: 'MY',
    disclaimerCode: 'PORTAL_DISCLAIMER', disclaimerHash: HASH,
    acceptedTerms: true, acceptedPrivacy: true,
  };
  const noConsent = await req(TD, 'POST', '/portal/register', { ...base, email: APPLICANT_EMAIL, acceptedPrivacy: false });
  check('registration without both consents rejected (400)', noConsent.status === 400);
  const freeMail = await req(TD, 'POST', '/portal/register', { ...base, email: 'someone@yahoo.com' });
  check('free-mail domain rejected under BLOCK policy (400)', freeMail.status === 400);
  const staleHash = await req(TD, 'POST', '/portal/register', { ...base, email: APPLICANT_EMAIL, disclaimerHash: 'a'.repeat(64) });
  check('stale disclaimer hash rejected (409)', staleHash.status === 409);
  const registered = await req(TD, 'POST', '/portal/register', { ...base, email: APPLICANT_EMAIL });
  check('registration succeeds', registered.status === 201 && registered.data.ok === true, JSON.stringify(registered.data));
  const orgId = parseInt(td(`SELECT id FROM organization WHERE "organizationName" = '${COMPANY}'`), 10);
  const acceptance = td(`SELECT disclaimer_hash || '|' || accepted_terms || '|' || accepted_privacy FROM disclaimer_acceptance WHERE email = '${APPLICANT_EMAIL}'`);
  check('immutable acceptance record stored with exact hash', acceptance === `${HASH}|true|true`, acceptance);
  const enrollmentEmail = td(`SELECT payload->>'emailBody' FROM outbox_event WHERE payload->>'emailReceivers' LIKE '%${APPLICANT_EMAIL}%' ORDER BY created_at DESC LIMIT 1`);
  check('enrollment email queued with portal (3003) link', enrollmentEmail.includes('http://localhost:3003/enroll#token='), enrollmentEmail.slice(0, 80));
  const dupe = await req(TD, 'POST', '/portal/register', { ...base, email: APPLICANT_EMAIL });
  check('duplicate email rejected (409)', dupe.status === 409);

  // ── [3] Passkey login as the applicant ──
  console.log('\n[3] Applicant passkey login');
  const client = await loginWithFreshCredential(APPLICANT_EMAIL, orgId);
  check('applicant signs in with a passkey to their own org', !!client);

  // ── [4] Wizard draft ──
  console.log('\n[4] Application wizard');
  const draft = await req(RO, 'GET', '/api/portal/application', undefined, client);
  check('draft auto-created (WEB_ number, funder bound to org 2)',
    draft.status === 200 && draft.data.status === 'DRAFT' && String(draft.data.applicationNumber).startsWith('WEB_'),
    JSON.stringify(draft.data));
  const badProduct = await req(RO, 'PUT', '/api/portal/application', { productCode: 'NOPE' }, client);
  check('unknown product rejected (400)', badProduct.status === 400);

  const profilePayload = {
    companyProfile: {
      companyName: COMPANY, businessRegistrationNumber: COMPANY_BRN, country: 'MY',
      address: '12 Jalan E2E, Kuala Lumpur', contactEmail: APPLICANT_EMAIL,
      directors: [{ name: 'Priya Raman' }, { name: 'Daniel Wong' }],
    },
    applicationForm: {
      monthlyRevenue: 850000, financingVolume: 2000000, averageInvoiceSize: 120000,
      clientBase: 'B2B', customerConcentrationPct: 35, paymentTerms: 'Net 60',
    },
    directors: [
      { name: 'Priya Raman', passportDocUuid: 'pending' },
      { name: 'Daniel Wong', passportDocUuid: 'pending' },
    ],
    eResolutionDocUuid: 'pending',
    bankAccount: { beneficiaryName: COMPANY, swift: 'MBBEMYKL', iban: '', bankName: 'Maybank' },
  };
  const saved = await req(RO, 'PUT', '/api/portal/application', { productCode: 'IF', payload: profilePayload }, client);
  check('wizard sections saved', saved.status === 200 && saved.data.productCode === 'IF');

  // ── [5] Real document uploads (MinIO) ──
  console.log('\n[5] Document uploads');
  const documents = {};
  for (const cls of ['COMPANY_REGISTRY', 'FINANCIAL_STATEMENTS', 'BANK_STATEMENT', 'PROOF_OF_ADDRESS']) {
    const up = await uploadCsv(client, cls, orgId, `${cls.toLowerCase()}.csv`,
      `field,value\ncompany,${COMPANY}\nregistration,${COMPANY_BRN}\nclass,${cls}\n`);
    if (up.status !== 201) {
      check(`upload ${cls}`, false, JSON.stringify(up.data));
    } else {
      documents[cls] = [{ uuid: up.data.documentUuid, fileName: `${cls.toLowerCase()}.csv` }];
    }
  }
  check('all 4 required classes uploaded through the real API', Object.keys(documents).length === 4);
  await req(RO, 'PUT', '/api/portal/application', { payload: { documents } }, client);

  // ── [6] Submit validations ──
  console.log('\n[6] Submit validations');
  const badBank = await req(RO, 'PUT', '/api/portal/application', {
    payload: { bankAccount: { beneficiaryName: COMPANY, swift: 'DEUTDEFF', iban: 'DE89370400440532013000' } },
  }, client);
  check('bank details editable pre-submit', badBank.status === 200);
  const blockedSubmit = await req(RO, 'POST', '/api/portal/application/submit', {}, client);
  check('HARD_BLOCK bank-country mismatch stops submission (400)',
    blockedSubmit.status === 400 && JSON.stringify(blockedSubmit.data).includes('Bank country mismatch'),
    JSON.stringify(blockedSubmit.data));
  await req(RO, 'PUT', '/api/portal/application', {
    payload: { bankAccount: { beneficiaryName: COMPANY, swift: 'MBBEMYKL', iban: '', bankName: 'Maybank' } },
  }, client);

  // Seed the financial report (copy the ABC worked-example rows) so
  // Filter-1 scores immediately on submit — the extraction pipeline itself
  // is covered by document-management's own guards.
  ro(`INSERT INTO financial_credit_report (organization_id, ${ro(`SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name='financial_credit_report' AND column_name NOT IN ('id','organization_id')`)})
      SELECT ${orgId}, ${ro(`SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name='financial_credit_report' AND column_name NOT IN ('id','organization_id')`)}
      FROM financial_credit_report WHERE organization_id = 2`);
  const reportCount = ro(`SELECT COUNT(*) FROM financial_credit_report WHERE organization_id = ${orgId}`);
  check('financial reports staged for scoring', parseInt(reportCount, 10) >= 2, reportCount);

  // ── [7] Submit -> Filter-1 scoring ──
  console.log('\n[7] Submit & Filter-1 scoring');
  const submitted = await req(RO, 'POST', '/api/portal/application/submit', {}, client);
  check('submission accepted and scored PASS immediately',
    submitted.status === 201 && submitted.data.status === 'SCORED_PASS',
    JSON.stringify(submitted.data));
  const appId = submitted.data.id;
  const scoringRow = ro(`SELECT risk_filter_1_total_score || '|' || risk_filter_1_category || '|' || "risk_filter_1_status" FROM risk_application_scoring WHERE "applicationId" = ${appId}`);
  check('Filter-1 score persisted (87.5 LOW risk = pass)', scoringRow.startsWith('87.5|LOW|APPROVED'), scoringRow);
  const flags = ro(`SELECT "complianceFlags"->>'ekycProvider' FROM application WHERE id = ${appId}`);
  check('mock eKYC flags recorded', flags === 'MOCK', flags);
  const editAfter = await req(RO, 'PUT', '/api/portal/application', { payload: {} }, client);
  check('submitted application no longer editable (400)', editAfter.status === 400);

  // ── [8] Kafka loop -> CRM supervisor queue ──
  console.log('\n[8] CRM supervisor queue (real Kafka)');
  const intakeRow = await (async () => {
    const until = Date.now() + 30_000;
    for (;;) {
      const rows = await req(CRM, 'GET', '/api/crm/applicants-web', undefined, admin);
      const match = (rows.data ?? []).find?.((r) => r.applicationId === appId);
      if (match || Date.now() > until) return match ?? null;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('APPLICATION_SCORED projected into the supervisor queue',
    !!intakeRow && intakeRow.result === 'PASS' && intakeRow.companyName === COMPANY,
    JSON.stringify(intakeRow));
  if (intakeRow) {
    const adminPersonId = parseInt(td(`SELECT id FROM person WHERE email='${ADMIN_EMAIL}'`), 10);
    const assigned = await req(CRM, 'POST', `/api/crm/applicants-web/${intakeRow.id}/assign`, { rmPersonId: adminPersonId }, admin);
    check('supervisor assigns the applicant to an RM', assigned.status === 201 && assigned.data.ok === true);
  }
  const clientOnFunderApi = await req(RO, 'GET', '/api/intake/applications', undefined, client);
  check('portal client denied on funder intake endpoints (403)', clientOnFunderApi.status === 403);

  // ── [9] CRC bucket ──
  console.log('\n[9] CRC new-application bucket');
  const bucket = await req(RO, 'GET', '/api/intake/applications?bucket=crc', undefined, admin);
  check('passed application queues for CRC pickup',
    bucket.status === 200 && (bucket.data ?? []).some((a) => a.id === appId));
  const detail = await req(RO, 'GET', `/api/intake/applications/${appId}`, undefined, admin);
  check('funder detail exposes payload + compliance flags',
    detail.status === 200 && detail.data.applicationPayload?.companyProfile?.companyName === COMPANY &&
    detail.data.complianceFlags?.ekycProvider === 'MOCK');

  // ── [10] RM fail->pass override ──
  console.log('\n[10] RM override');
  ro(`INSERT INTO application ("organizationId", "clientOrganizationName", "applicationStatus", "applicationNumber", "funderOrganizationId", "productCode", "applicationPayload")
      VALUES (${orgId}, '${COMPANY} (fail case)', 'SCORED_FAIL', 'E2EP_FAIL1', ${ORG2}, 'IF', '{}')`);
  const failAppId = parseInt(ro(`SELECT id FROM application WHERE "applicationNumber" = 'E2EP_FAIL1'`), 10);
  const override = await req(RO, 'POST', `/api/intake/applications/${failAppId}/override-pass`, {}, admin);
  check('override flips FAIL -> PASS', override.status === 201 && override.data.status === 'SCORED_PASS');
  const overrideAudit = ro(`SELECT COUNT(*) FROM risk_audit_log WHERE event = 'APPLICATION_STATUS_OVERRIDDEN' AND (payload->>'applicationId')::int = ${failAppId}`);
  check('override recorded in the risk audit log', overrideAudit === '1', overrideAudit);
  const cancelOutbox = ro(`SELECT COUNT(*) FROM outbox_event WHERE topic = 'sla_timer_cancel' AND (payload->>'subjectId') = '${failAppId}'`);
  check('SLA engagement timer cancel queued', cancelOutbox === '1', cancelOutbox);

  // ── [11] SLA breach closes an unengaged FAIL ──
  console.log('\n[11] Engagement-window breach close (real Kafka)');
  ro(`INSERT INTO application ("organizationId", "clientOrganizationName", "applicationStatus", "applicationNumber", "funderOrganizationId", "productCode", "applicationPayload")
      VALUES (${orgId}, '${COMPANY} (stale fail)', 'SCORED_FAIL', 'E2EP_FAIL2', ${ORG2}, 'IF', '{}')`);
  const staleAppId = parseInt(ro(`SELECT id FROM application WHERE "applicationNumber" = 'E2EP_FAIL2'`), 10);
  // Emit SLA_BREACHED through a real outbox->Kafka hop (any service's relay
  // can carry the topic; in production the SLA engine emits it).
  pc(`INSERT INTO outbox_event (id, topic, payload, status)
      VALUES (gen_random_uuid(), 'sla_breached',
        ('{"eventId":"' || gen_random_uuid() || '","funderOrganizationId":${ORG2},"slaCode":"RM_APPLICANT_ENGAGEMENT","subjectType":"APPLICATION","subjectId":"${staleAppId}"}')::jsonb, 'pending')`);
  const closedStatus = await (async () => {
    const until = Date.now() + 30_000;
    for (;;) {
      const status = ro(`SELECT "applicationStatus" FROM application WHERE id = ${staleAppId}`);
      if (status === 'CLOSED_ARCHIVED' || Date.now() > until) return status;
      await new Promise((r) => setTimeout(r, 2500));
    }
  })();
  check('breach consumer closes + archives the application', closedStatus === 'CLOSED_ARCHIVED', closedStatus);

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  console.log('Cleaning up…');
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
