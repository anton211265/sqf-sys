// E2E test for CRC pass 1 — Filter-2 risk model authoring, maker-checker
// lifecycle and qualitative assessments. Runs on the HOST against the real
// stack: real Postgres, real HTTP through nginx, real passkey logins, real
// cross-service RBAC. No mocks.
//
//   node apps/risk-operation/scripts/e2e-crc.mjs
//
// All writes happen in a script-created Org E. Org 2 is only read for the
// isolation check. Requires Node >= 22.
//
// Scoring orientation under test: risk-points (HIGH total = HIGH risk) —
// deliberately opposite to Filter-1; see docs/design/crc-sitemap-annotation.md.

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import {
  SoftAuthenticator,
  sha256,
} from '../../trade-directory/src/scripts/lib/soft-authenticator.mjs';

const TD_BASE = 'http://localhost/trade-directory';
const RO_BASE = 'http://localhost/risk-operation';
const ORIGIN = 'http://localhost:3001';
const ORG2 = 2;
const ORG_E_NAME = 'E2E CRC Org E';
const SUPER_EMAIL = 'e2e-crc-super@test.local';
const MAKER_EMAIL = 'e2e-crc-maker@test.local';
const CHECKER_EMAIL = 'e2e-crc-checker@test.local';
const CM_EMAIL = 'e2e-crc-cm@test.local';
const VIEWER_EMAIL = 'e2e-crc-viewer@test.local';
const ORG2_EMAIL = 'e2e-crc-org2@test.local';

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
const get = (path, token) => req(RO_BASE, 'GET', path, undefined, token);
const post = (path, body, token) => req(RO_BASE, 'POST', path, body, token);
const put = (path, body, token) => req(RO_BASE, 'PUT', path, body, token);

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
     SELECT '${roleName}', false, id FROM organization WHERE "organizationName" = '${ORG_E_NAME}'`,
  );
  for (const key of keys) {
    td(
      `INSERT INTO role_permission ("roleId", "permissionId")
       SELECT r.id, p.id FROM organization_role r
       JOIN organization o ON o.id = r."organizationId", permission p
       WHERE r.name = '${roleName}' AND o."organizationName" = '${ORG_E_NAME}'
         AND p."permKey" = '${key}'`,
    );
  }
};

function setup() {
  teardown();
  td(`INSERT INTO organization ("organizationName", country) VALUES ('${ORG_E_NAME}', 'MY')`);
  for (const email of [SUPER_EMAIL, MAKER_EMAIL, CHECKER_EMAIL, CM_EMAIL, VIEWER_EMAIL]) {
    td(`INSERT INTO person (name, email) VALUES ('${email.split('@')[0]}', '${email}')`);
    td(
      `INSERT INTO organization_person ("organizationId", "personId", designation)
       SELECT o.id, p.id, 'E2E' FROM organization o, person p
       WHERE o."organizationName" = '${ORG_E_NAME}' AND p.email = '${email}'`,
    );
  }
  td(
    `INSERT INTO organization_role (name, "isImmutable", "organizationId")
     SELECT 'Super Admin', true, id FROM organization WHERE "organizationName" = '${ORG_E_NAME}'`,
  );
  td(
    `INSERT INTO person_role ("personId", "roleId")
     SELECT p.id, r.id FROM person p, organization_role r
     JOIN organization o ON o.id = r."organizationId"
     WHERE p.email = '${SUPER_EMAIL}' AND o."organizationName" = '${ORG_E_NAME}' AND r."isImmutable" = true`,
  );
  grantRole('E2E CO Maker', [
    'risk_models_view',
    'risk_models_edit',
    'risk_assessments_view',
    'risk_assessments_conduct',
  ]);
  grantRole('E2E CO Checker', ['risk_models_view', 'risk_models_check']);
  grantRole('E2E CM', ['risk_models_view', 'risk_models_publish', 'risk_assessments_view']);
  grantRole('E2E Viewer', ['risk_models_view']);
  for (const [email, role] of [
    [MAKER_EMAIL, 'E2E CO Maker'],
    [CHECKER_EMAIL, 'E2E CO Checker'],
    [CM_EMAIL, 'E2E CM'],
    [VIEWER_EMAIL, 'E2E Viewer'],
  ]) {
    td(
      `INSERT INTO person_role ("personId", "roleId")
       SELECT p.id, r.id FROM person p, organization_role r
       JOIN organization o ON o.id = r."organizationId"
       WHERE p.email = '${email}' AND r.name = '${role}' AND o."organizationName" = '${ORG_E_NAME}'`,
    );
  }
  td(`INSERT INTO person (name, email) VALUES ('crc-org2', '${ORG2_EMAIL}')`);
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
  const orgEId = td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_E_NAME}'`);
  if (orgEId) {
    ro(`DELETE FROM risk_assessment_answer WHERE risk_assessment_id IN (SELECT id FROM risk_assessment WHERE funder_organization_id = ${orgEId})`);
    ro(`DELETE FROM risk_assessment WHERE funder_organization_id = ${orgEId}`);
    ro(`DELETE FROM risk_factor WHERE "riskModelId" IN (SELECT id FROM risk_model WHERE "funderOrganizationId" = ${orgEId})`);
    ro(`DELETE FROM risk_high_classification_factor WHERE "riskModelId" IN (SELECT id FROM risk_model WHERE "funderOrganizationId" = ${orgEId})`);
    ro(`DELETE FROM risk_model WHERE "funderOrganizationId" = ${orgEId}`);
    ro(`DELETE FROM risk_audit_log WHERE (payload->>'funderOrganizationId')::int = ${orgEId}`);
  }
  const emails = `'${SUPER_EMAIL}','${MAKER_EMAIL}','${CHECKER_EMAIL}','${CM_EMAIL}','${VIEWER_EMAIL}','${ORG2_EMAIL}'`;
  td(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM auth_audit_log WHERE email IN (${emails})`);
  td(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person_role WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email IN (${emails}))`);
  td(`DELETE FROM person WHERE email IN (${emails})`);
  if (orgEId) {
    td(`DELETE FROM rbac_audit_log WHERE "organizationId" = ${orgEId}`);
    td(`DELETE FROM role_permission WHERE "roleId" IN (SELECT id FROM organization_role WHERE "organizationId" = ${orgEId})`);
    td(`DELETE FROM organization_role WHERE "organizationId" = ${orgEId}`);
    td(`DELETE FROM organization WHERE id = ${orgEId}`);
  }
}

/** The worked-example model: all 8 scoring methods across 2 factor tabs. */
const VALID_FACTORS = [
  {
    name: 'Country & Political',
    weight: 40,
    categories: [
      {
        name: 'Geography',
        weight: 100,
        subFactors: [
          {
            name: 'Country of incorporation',
            weight: 40,
            scoring: {
              method: 'COUNTRY_SELECTION',
              config: { countries: [{ country: 'Malaysia', points: 2 }, { country: 'Iran', points: 10 }] },
            },
          },
          {
            name: 'PEP involvement',
            weight: 30,
            scoring: { method: 'BOOLEAN', config: { trueScore: 10, falseScore: 0 } },
          },
          {
            name: 'Analyst judgment score',
            weight: 30,
            scoring: { method: 'NUMERIC_SCORING', config: { min: 0, max: 10 } },
          },
        ],
      },
    ],
  },
  {
    name: 'Business Profile',
    weight: 60,
    categories: [
      {
        name: 'Financial conduct',
        weight: 50,
        subFactors: [
          {
            name: 'Years trading',
            weight: 40,
            scoring: {
              method: 'CONDITIONAL_NUMERIC',
              config: { conditions: [{ operator: 'LT', value: 3, points: 8 }, { operator: 'GT', value: 10, points: 1 }] },
            },
          },
          {
            name: 'Audit opinion',
            weight: 60,
            scoring: {
              method: 'DROPDOWN_SELECTION',
              config: { options: [{ label: 'Clean', points: 0 }, { label: 'Qualified', points: 5 }, { label: 'Adverse', points: 10 }] },
            },
          },
        ],
      },
      {
        name: 'Documentation',
        weight: 50,
        subFactors: [
          {
            name: 'Registry age',
            weight: 30,
            scoring: {
              method: 'DATE_BASED',
              config: { operator: 'BEFORE', date: '2020-01-01', matchScore: 1, elseScore: 6 },
            },
          },
          {
            name: 'License validity',
            weight: 30,
            scoring: {
              method: 'DATE_RANGE',
              config: { startDate: '2026-01-01', endDate: '2026-12-31', inScore: 0, outScore: 7 },
            },
          },
          {
            name: 'Ownership transparency',
            weight: 40,
            scoring: {
              method: 'LABEL_SELECTION',
              config: {
                min: 0,
                max: 10,
                labels: [
                  { label: 'Transparent', points: 0 },
                  { label: 'Complex', points: 6, subOptions: [{ label: 'Layered', points: 4 }, { label: 'Opaque trust', points: 6 }] },
                  { label: 'Unknown', points: 10 },
                ],
              },
            },
          },
        ],
      },
    ],
  },
];
const VALID_OVERRIDES = [
  { name: 'Sanctions hit', description: 'Named on OFAC/EU/UN sanctions list' },
  { name: 'Forged documents', description: 'Any submitted document proven forged' },
];
const THRESHOLDS = { low: [0, 20], medium: [21, 50], high: [51, 100] };

/** Answers for the worked example — expected total 56.8 → HIGH. */
const WORKED_ANSWERS = {
  nodes: {
    'f0.c0.s0': 'Iran', // 10/10 * .4*1*.4  -> 16
    'f0.c0.s1': false, //  0/10            ->  0
    'f0.c0.s2': 5, //      5/10 * .4*1*.3  ->  6
    'f1.c0.s0': 2, //      8/8  * .6*.5*.4 -> 12
    'f1.c0.s1': 'Qualified', // 5/10 * .18 ->  9
    'f1.c1.s0': '2021-05-01', // 6/6 * .09 ->  9
    'f1.c1.s1': '2026-06-15', // 0/7       ->  0
    'f1.c1.s2': { label: 'Complex', subOption: 'Layered' }, // 4/10 * .12 -> 4.8
  },
  overrides: {},
};

async function main() {
  process.stdout.write('Waiting for services');
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${RO_BASE}/`, { signal: AbortSignal.timeout(2000) });
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
  const orgEId = parseInt(td(`SELECT id FROM organization WHERE "organizationName" = '${ORG_E_NAME}'`), 10);
  const superAdmin = await createLogin(SUPER_EMAIL, orgEId);
  const maker = await createLogin(MAKER_EMAIL, orgEId);
  const checker = await createLogin(CHECKER_EMAIL, orgEId);
  const cm = await createLogin(CM_EMAIL, orgEId);
  const viewer = await createLogin(VIEWER_EMAIL, orgEId);
  const org2Admin = await createLogin(ORG2_EMAIL, ORG2);

  // ── [1] Guard basics ──
  console.log('\n[1] Permission guard');
  const noToken = await get('/api/crc/risk-models');
  check('unauthenticated denied (403)', noToken.status === 403);
  const viewerCreate = await post('/api/crc/risk-models', { riskModelName: 'X' }, viewer.accessToken);
  check('create denied without risk_models_edit (403)', viewerCreate.status === 403);
  const viewerList = await get('/api/crc/risk-models', viewer.accessToken);
  check('view allowed with risk_models_view (200)', viewerList.status === 200);
  const makerAssessListDenied = await get('/api/crc/assessments', checker.accessToken);
  check('assessments denied without risk_assessments_view (403)', makerAssessListDenied.status === 403);

  // ── [2] Authoring + validation ──
  console.log('\n[2] Authoring & validation');
  const created = await post('/api/crc/risk-models', {
    riskModelName: 'E2E Country & Governance Filter',
    description: 'Worked example covering all 8 scoring methods',
    modelShape: 'MULTI_FACTOR',
  }, maker.accessToken);
  check('draft created with RM_ number', created.status === 201 && /^RM_[A-Z2-9]{6}$/.test(created.data.riskModelNumber), JSON.stringify(created.data));
  const modelId = created.data.id;

  const dupName = await post('/api/crc/risk-models', { riskModelName: 'E2E Country & Governance Filter' }, maker.accessToken);
  check('duplicate name within funder rejected (400)', dupName.status === 400);

  // Save with broken weights, then broken sub-scoring, then valid
  const badWeights = JSON.parse(JSON.stringify(VALID_FACTORS));
  badWeights[0].weight = 50; // 50 + 60 = 110
  await put(`/api/crc/risk-models/${modelId}`, { factors: badWeights, overrides: VALID_OVERRIDES, thresholds: THRESHOLDS }, maker.accessToken);
  const submitBadWeights = await post(`/api/crc/risk-models/${modelId}/submit`, {}, maker.accessToken);
  check(
    'submit rejects factor weights != 100 (400)',
    submitBadWeights.status === 400 && JSON.stringify(submitBadWeights.data).includes('total 100'),
    JSON.stringify(submitBadWeights.data),
  );

  const badSub = JSON.parse(JSON.stringify(VALID_FACTORS));
  badSub[1].categories[1].subFactors[2].scoring.config.labels[1].subOptions[0].points = 9; // > parent label's 6
  await put(`/api/crc/risk-models/${modelId}`, { factors: badSub }, maker.accessToken);
  const submitBadSub = await post(`/api/crc/risk-models/${modelId}/submit`, {}, maker.accessToken);
  check(
    'submit rejects sub-scoring above parent label points (400)',
    submitBadSub.status === 400 && JSON.stringify(submitBadSub.data).toLowerCase().includes('sub-scoring'),
    JSON.stringify(submitBadSub.data),
  );

  const badLabelMax = JSON.parse(JSON.stringify(VALID_FACTORS));
  badLabelMax[1].categories[1].subFactors[2].scoring.config.labels[2].points = 8; // highest label < range max 10
  await put(`/api/crc/risk-models/${modelId}`, { factors: badLabelMax }, maker.accessToken);
  const submitBadLabelMax = await post(`/api/crc/risk-models/${modelId}/submit`, {}, maker.accessToken);
  check(
    'submit rejects label set not covering range max (400)',
    submitBadLabelMax.status === 400 && JSON.stringify(submitBadLabelMax.data).includes('range maximum'),
    JSON.stringify(submitBadLabelMax.data),
  );

  const validSave = await put(`/api/crc/risk-models/${modelId}`, { factors: VALID_FACTORS, overrides: VALID_OVERRIDES, thresholds: THRESHOLDS }, maker.accessToken);
  check('valid structure saved', validSave.status === 200);
  const roundTrip = await get(`/api/crc/risk-models/${modelId}`, maker.accessToken);
  check(
    'structure round-trips (2 tabs, 8 leaves, 2 overrides)',
    roundTrip.status === 200 &&
      roundTrip.data.factors.length === 2 &&
      roundTrip.data.factors[1].categories.length === 2 &&
      roundTrip.data.overrides.length === 2 &&
      roundTrip.data.factors[1].categories[1].subFactors[2].scoring.config.labels[1].subOptions.length === 2,
    JSON.stringify(roundTrip.data.factors?.[1]?.categories?.[1]),
  );

  // ── [3] Maker-checker lifecycle ──
  console.log('\n[3] Maker-checker lifecycle');
  const earlyPublish = await post(`/api/crc/risk-models/${modelId}/publish`, {}, cm.accessToken);
  check('publish before check rejected (400)', earlyPublish.status === 400);
  const submitted = await post(`/api/crc/risk-models/${modelId}/submit`, {}, maker.accessToken);
  check('submitted → PENDING_CHECK', submitted.status === 201 && submitted.data.status === 'PENDING_CHECK');
  const editWhilePending = await put(`/api/crc/risk-models/${modelId}`, { description: 'x' }, maker.accessToken);
  check('editing a submitted model rejected (400)', editWhilePending.status === 400);
  const makerSelfCheck = await post(`/api/crc/risk-models/${modelId}/check`, {}, maker.accessToken);
  check('maker check denied by key gate (403)', makerSelfCheck.status === 403);
  const checked = await post(`/api/crc/risk-models/${modelId}/check`, {}, checker.accessToken);
  check('checker verifies → CHECKED', checked.status === 201 && checked.data.status === 'CHECKED');
  const published = await post(`/api/crc/risk-models/${modelId}/publish`, {}, cm.accessToken);
  check('CM publishes → PUBLISHED', published.status === 201 && published.data.status === 'PUBLISHED');
  const editPublished = await put(`/api/crc/risk-models/${modelId}`, { description: 'x' }, maker.accessToken);
  check('published model immutable (400)', editPublished.status === 400);

  // Code-side segregation beyond key gates: super holds ALL keys
  const superModel = await post('/api/crc/risk-models', { riskModelName: 'E2E Segregation Probe', modelShape: 'SIMPLE_WEIGHTED' }, superAdmin.accessToken);
  await put(`/api/crc/risk-models/${superModel.data.id}`, {
    factors: [
      { name: 'Only factor', weight: 100, scoring: { method: 'BOOLEAN', config: { trueScore: 5, falseScore: 0 } } },
    ],
    overrides: [],
    thresholds: THRESHOLDS,
  }, superAdmin.accessToken);
  await post(`/api/crc/risk-models/${superModel.data.id}/submit`, {}, superAdmin.accessToken);
  const superSelfCheck = await post(`/api/crc/risk-models/${superModel.data.id}/check`, {}, superAdmin.accessToken);
  check('maker cannot self-check even with every key (403)', superSelfCheck.status === 403);
  await post(`/api/crc/risk-models/${superModel.data.id}/check`, {}, checker.accessToken);
  const checkerPublish = await post(`/api/crc/risk-models/${superModel.data.id}/publish`, {}, superAdmin.accessToken);
  check('maker cannot publish own model even with every key (403)', checkerPublish.status === 403);
  const cmPublishes2 = await post(`/api/crc/risk-models/${superModel.data.id}/publish`, {}, cm.accessToken);
  check('independent CM publish succeeds', cmPublishes2.status === 201);

  // Return-to-draft path
  const returned = await post('/api/crc/risk-models', { riskModelName: 'E2E Return Probe', modelShape: 'SIMPLE_WEIGHTED' }, maker.accessToken);
  await put(`/api/crc/risk-models/${returned.data.id}`, {
    factors: [{ name: 'F', weight: 100, scoring: { method: 'BOOLEAN', config: { trueScore: 3, falseScore: 0 } } }],
    overrides: [],
    thresholds: THRESHOLDS,
  }, maker.accessToken);
  await post(`/api/crc/risk-models/${returned.data.id}/submit`, {}, maker.accessToken);
  const sentBack = await post(`/api/crc/risk-models/${returned.data.id}/return`, { note: 'Weight rationale missing' }, checker.accessToken);
  check('checker returns to DRAFT with note', sentBack.status === 201 && sentBack.data.status === 'DRAFT');
  const editableAgain = await put(`/api/crc/risk-models/${returned.data.id}`, { description: 'revised' }, maker.accessToken);
  check('returned model editable again', editableAgain.status === 200);

  // ── [4] Assessments (worked example) ──
  console.log('\n[4] Assessments');
  const draftAssess = await post('/api/crc/assessments', {
    riskModelId: returned.data.id,
    organizationId: 5,
    answers: { nodes: {}, overrides: {} },
  }, maker.accessToken);
  check('assessment against non-published model rejected (400)', draftAssess.status === 400);

  const missingAnswer = await post('/api/crc/assessments', {
    riskModelId: modelId,
    organizationId: 5,
    answers: { nodes: { 'f0.c0.s0': 'Iran' }, overrides: {} },
  }, maker.accessToken);
  check('missing answers rejected with node named (400)', missingAnswer.status === 400 && JSON.stringify(missingAnswer.data).includes('missing answer'));

  const badLabel = await post('/api/crc/assessments', {
    riskModelId: modelId,
    organizationId: 5,
    answers: { nodes: { ...WORKED_ANSWERS.nodes, 'f1.c0.s1': 'Pristine' }, overrides: {} },
  }, maker.accessToken);
  check('unknown dropdown option rejected (400)', badLabel.status === 400);

  const assessment = await post('/api/crc/assessments', {
    riskModelId: modelId,
    organizationId: 5,
    organizationName: 'SUMMERSCAPE',
    answers: WORKED_ANSWERS,
  }, maker.accessToken);
  check(
    'worked example scores 56.8 → HIGH (risk-points orientation)',
    assessment.status === 201 && assessment.data.totalScore === 56.8 && assessment.data.classification === 'HIGH',
    JSON.stringify(assessment.data),
  );
  check(
    'breakdown contributions roll up per factor',
    Math.abs((assessment.data.breakdown?.factors?.[0]?.contribution ?? 0) - 22) < 0.001 &&
      Math.abs((assessment.data.breakdown?.factors?.[1]?.contribution ?? 0) - 34.8) < 0.001,
    JSON.stringify(assessment.data.breakdown),
  );

  const overridden = await post('/api/crc/assessments', {
    riskModelId: modelId,
    organizationId: 6,
    organizationName: 'E2E Override Client',
    answers: { nodes: {}, overrides: { 'Sanctions hit': true } },
  }, maker.accessToken);
  check(
    'tripped override short-circuits to 100/HIGH without other answers',
    overridden.status === 201 && overridden.data.totalScore === 100 && overridden.data.classification === 'HIGH' && overridden.data.overrideTripped === true,
    JSON.stringify(overridden.data),
  );

  const viewerConduct = await post('/api/crc/assessments', {
    riskModelId: modelId,
    organizationId: 5,
    answers: WORKED_ANSWERS,
  }, viewer.accessToken);
  check('conduct denied without risk_assessments_conduct (403)', viewerConduct.status === 403);

  const listFiltered = await get('/api/crc/assessments?organizationId=5', maker.accessToken);
  check(
    'assessment list filters by client organization',
    listFiltered.status === 200 && listFiltered.data.length === 1 && listFiltered.data[0].organizationName === 'SUMMERSCAPE',
    JSON.stringify(listFiltered.data),
  );

  const detail = await get(`/api/crc/assessments/${assessment.data.id}`, cm.accessToken);
  check(
    'assessment detail returns answers + per-node contributions',
    detail.status === 200 && detail.data.answers.length === 8 &&
      detail.data.answers.find((a) => a.nodeKey === 'f0.c0.s0')?.points === 10,
    JSON.stringify(detail.data.answers?.slice(0, 2)),
  );

  // ── [5] Snapshot immutability & duplicate-existing ──
  console.log('\n[5] Snapshot immutability & duplication');
  await post(`/api/crc/risk-models/${modelId}/archive`, {}, cm.accessToken);
  const archivedModel = await get(`/api/crc/risk-models/${modelId}`, maker.accessToken);
  check('published model archived', archivedModel.data.status === 'ARCHIVED');
  const detailAfterArchive = await get(`/api/crc/assessments/${assessment.data.id}`, cm.accessToken);
  check(
    'assessment snapshot survives model archival intact',
    detailAfterArchive.status === 200 &&
      detailAfterArchive.data.modelSnapshot.factors.length === 2 &&
      Number(detailAfterArchive.data.totalScore) === 56.8,
  );

  const duplicated = await post('/api/crc/risk-models', {
    riskModelName: 'E2E Country & Governance Filter v2',
    duplicateFromId: modelId,
  }, maker.accessToken);
  const dupStructure = await get(`/api/crc/risk-models/${duplicated.data.id}`, maker.accessToken);
  check(
    'duplicate-existing copies full structure into a new DRAFT',
    duplicated.status === 201 && dupStructure.data.status === 'DRAFT' &&
      dupStructure.data.factors.length === 2 && dupStructure.data.overrides.length === 2 &&
      dupStructure.data.riskModelNumber !== created.data.riskModelNumber,
    JSON.stringify(dupStructure.data.overrides),
  );

  // ── [6] Tenant isolation ──
  console.log('\n[6] Tenant isolation');
  const org2View = await get(`/api/crc/risk-models/${modelId}`, org2Admin.accessToken);
  check('org 2 cannot read Org E model (404)', org2View.status === 404);
  const org2List = await get('/api/crc/risk-models', org2Admin.accessToken);
  check('org 2 list excludes Org E models', org2List.status === 200 && !(org2List.data ?? []).some((m) => m.funderOrganizationId === orgEId));
  const org2Assessments = await get('/api/crc/assessments', org2Admin.accessToken);
  check('org 2 sees no Org E assessments', org2Assessments.status === 200 && (org2Assessments.data ?? []).length === 0);

  // ── [7] Audit trail ──
  console.log('\n[7] Audit trail');
  const auditEvents = ro(
    `SELECT event FROM risk_audit_log WHERE (payload->>'funderOrganizationId')::int = ${orgEId} ORDER BY id`,
  ).split('\n').filter(Boolean);
  const expectedEvents = ['MODEL_CREATED', 'MODEL_UPDATED', 'MODEL_SUBMITTED', 'MODEL_CHECKED', 'MODEL_PUBLISHED', 'MODEL_RETURNED', 'MODEL_ARCHIVED', 'ASSESSMENT_CONDUCTED'];
  check(
    'audit trail covers the full lifecycle',
    expectedEvents.every((e) => auditEvents.includes(e)),
    `have: ${[...new Set(auditEvents)].join(',')}`,
  );
  const assessmentAudit = ro(
    `SELECT payload->>'classification' FROM risk_audit_log
     WHERE event = 'ASSESSMENT_CONDUCTED' AND (payload->>'funderOrganizationId')::int = ${orgEId}
       AND (payload->>'assessmentId')::int = ${assessment.data.id}`,
  );
  check('assessment audit row carries the outcome', assessmentAudit === 'HIGH', assessmentAudit);

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
