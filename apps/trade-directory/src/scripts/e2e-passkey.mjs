// E2E test for the passkey (WebAuthn) + QR cross-device login rebuild.
// Runs on the HOST against the real stack (nginx :80 → trade-directory,
// real Postgres, real WebSocket) — no mocks, per the SQF testing policy.
//
//   node apps/trade-directory/src/scripts/e2e-passkey.mjs
//
// It implements a software authenticator: real P-256 keys, hand-built CBOR
// attestation objects and DER-signed assertions, exercising the server's
// actual SimpleWebAuthn verification. Test identities are created directly
// in Postgres via docker compose exec psql, and removed at the end.
//
// Requires Node >= 22 (global fetch + WebSocket).

import { execSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { SoftAuthenticator, b64u, sha256 } from './lib/soft-authenticator.mjs';

const BASE = 'http://localhost/trade-directory';
const ORIGIN = 'http://localhost:3001';
const RP_ID = 'localhost';
const TEST_EMAIL = 'e2e-passkey@test.local';
const ORG_ID = 2; // Synlian — existing dev org


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

// ---------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------
async function post(path, body, { token, userAgent, cookie } = {}) {
  const headers = { 'Content-Type': 'application/json', Origin: ORIGIN };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (userAgent) headers['User-Agent'] = userAgent;
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data, headers: res.headers };
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Origin: ORIGIN },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty */
  }
  return { status: res.status, data };
}

const refreshCookie = (headers) => {
  const setCookie = headers.getSetCookie?.() ?? [];
  const rt = setCookie.find((c) => c.startsWith('refresh_token='));
  return rt ? rt.split(';')[0] : null;
};

// ---------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------
function setup() {
  teardown(); // idempotent
  psql(
    `INSERT INTO person (name, email) VALUES ('E2E Passkey', '${TEST_EMAIL}')`,
  );
  psql(
    `INSERT INTO organization_person ("organizationId", "personId", designation)
     SELECT ${ORG_ID}, id, 'E2E' FROM person WHERE email = '${TEST_EMAIL}'`,
  );
  psql(
    `INSERT INTO organization_person_role (role, "organizationPersonId")
     SELECT 'SUPERUSER', op.id FROM organization_person op
     JOIN person p ON p.id = op."personId" WHERE p.email = '${TEST_EMAIL}'`,
  );
}

function insertEnrollmentToken(rawToken) {
  const hash = sha256(rawToken).toString('hex');
  psql(
    `INSERT INTO enrollment_token ("personId", "tokenHash", "expiresAt")
     SELECT id, '${hash}', LOCALTIMESTAMP + interval '1 hour'
     FROM person WHERE email = '${TEST_EMAIL}'`,
  );
}

function teardown() {
  psql(`DELETE FROM enrollment_token WHERE "personId" IN (SELECT id FROM person WHERE email = '${TEST_EMAIL}')`);
  psql(`DELETE FROM webauthn_credential WHERE "personId" IN (SELECT id FROM person WHERE email = '${TEST_EMAIL}')`);
  psql(`DELETE FROM auth_audit_log WHERE email = '${TEST_EMAIL}'`);
  psql(`DELETE FROM token WHERE "personId" IN (SELECT id FROM person WHERE email = '${TEST_EMAIL}')`);
  psql(`DELETE FROM organization_person_role WHERE "organizationPersonId" IN (
          SELECT op.id FROM organization_person op JOIN person p ON p.id = op."personId"
          WHERE p.email = '${TEST_EMAIL}')`);
  psql(`DELETE FROM organization_person WHERE "personId" IN (SELECT id FROM person WHERE email = '${TEST_EMAIL}')`);
  psql(`DELETE FROM person WHERE email = '${TEST_EMAIL}'`);
}

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------
async function main() {
  // Editing files under apps/trade-directory/src (this script included)
  // makes webpack-watch rebuild the service — wait until it answers again.
  process.stdout.write('Waiting for trade-directory to be ready');
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(2000) });
      if (res.status === 404) break; // no route at / = service is up
    } catch {
      /* not up yet */
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  console.log(' ready.');

  console.log('Setting up test identity in Postgres…');
  setup();

  const authenticator = new SoftAuthenticator();

  // ── Registration (enrollment-token mode) ─────────────────────────
  console.log('\n[1] Enrollment-token registration');

  const badOptions = await post('/auth/passkey/register-options', {
    enrollmentToken: 'not-a-real-token',
  });
  check(
    'invalid enrollment token rejected (401)',
    badOptions.status === 401,
    JSON.stringify({ status: badOptions.status, data: badOptions.data }),
  );

  const rawToken = randomBytes(48).toString('base64url');
  insertEnrollmentToken(rawToken);

  const regOptions = await post('/auth/passkey/register-options', {
    enrollmentToken: rawToken,
  });
  check('register-options returns options', regOptions.status === 201 && !!regOptions.data?.options?.challenge, JSON.stringify(regOptions.data));
  check('register-options echoes email', regOptions.data?.email === TEST_EMAIL);
  check(
    'userVerification is required',
    regOptions.data?.options?.authenticatorSelection?.userVerification === 'required',
  );

  const regVerify = await post('/auth/passkey/register-verify', {
    registrationSessionId: regOptions.data.registrationSessionId,
    response: authenticator.makeRegistrationResponse(regOptions.data.options.challenge),
    label: 'E2E soft authenticator',
  });
  check('register-verify verifies attestation', regVerify.status === 201 && regVerify.data?.verified === true, JSON.stringify(regVerify.data));

  const reusedToken = await post('/auth/passkey/register-options', {
    enrollmentToken: rawToken,
  });
  check('enrollment token is single-use (401 on reuse)', reusedToken.status === 401);

  const replaySession = await post('/auth/passkey/register-verify', {
    registrationSessionId: regOptions.data.registrationSessionId,
    response: authenticator.makeRegistrationResponse(regOptions.data.options.challenge),
  });
  check('registration session is single-use (401 on replay)', replaySession.status === 401);

  // ── Passkey login ────────────────────────────────────────────────
  console.log('\n[2] Passkey login');

  const wrongOrg = await post('/auth/passkey/login-options', {
    email: TEST_EMAIL,
    orgId: 999999,
  });
  check('login-options rejects non-member org (401)', wrongOrg.status === 401);

  const loginOptions = await post('/auth/passkey/login-options', {
    email: TEST_EMAIL,
    orgId: ORG_ID,
  });
  check('login-options returns challenge', loginOptions.status === 201 && !!loginOptions.data?.options?.challenge);
  check(
    'allowCredentials carries the registered credential',
    (loginOptions.data?.options?.allowCredentials ?? []).some(
      (c) => c.id === b64u(authenticator.credentialId),
    ),
  );

  const loginVerify = await post('/auth/passkey/login-verify', {
    loginSessionId: loginOptions.data.loginSessionId,
    response: authenticator.makeAssertionResponse(loginOptions.data.options.challenge),
  });
  check('login-verify returns access token', loginVerify.status === 201 && !!loginVerify.data?.accessToken, JSON.stringify(loginVerify.data));
  const desktopRefreshCookie = refreshCookie(loginVerify.headers);
  check('login-verify sets httpOnly refresh cookie', !!desktopRefreshCookie);

  const accessToken = loginVerify.data.accessToken;
  const me = await get('/api/person/me', accessToken);
  check('access token works on /api/person/me', me.status === 200 && me.data?.email === TEST_EMAIL, JSON.stringify(me.data));

  const replayLogin = await post('/auth/passkey/login-verify', {
    loginSessionId: loginOptions.data.loginSessionId,
    response: authenticator.makeAssertionResponse(loginOptions.data.options.challenge),
  });
  check('login session is single-use (401 on replay)', replayLogin.status === 401);

  const refreshed = await post('/auth/refresh', {}, { cookie: desktopRefreshCookie });
  check('refresh rotation works after passkey login', refreshed.status === 201 && !!refreshed.data?.accessToken, JSON.stringify(refreshed.data));

  // Clone detection: replay an old counter value
  const cloneOptions = await post('/auth/passkey/login-options', {
    email: TEST_EMAIL,
    orgId: ORG_ID,
  });
  const staleAssertion = authenticator.makeAssertionResponse(
    cloneOptions.data.options.challenge,
    1, // counter already used
  );
  const cloneVerify = await post('/auth/passkey/login-verify', {
    loginSessionId: cloneOptions.data.loginSessionId,
    response: staleAssertion,
  });
  check('stale signature counter rejected (clone detection)', cloneVerify.status === 401);
  authenticator.counter = 2; // resync for later logins

  // ── QR cross-device login ────────────────────────────────────────
  console.log('\n[3] QR cross-device login');

  const qrInit = await post('/auth/qr/initiate', {});
  check('qr/initiate returns session + loginUrl', qrInit.status === 201 && !!qrInit.data?.loginUrl, JSON.stringify(qrInit.data));
  const loginUrl = new URL(qrInit.data.loginUrl);
  const qrSessionId = loginUrl.searchParams.get('session');
  const pin = (loginUrl.hash.match(/pin=([^&]+)/) ?? [])[1];
  check('loginUrl carries session param and pin fragment', !!qrSessionId && !!pin);

  const wsMessages = [];
  const ws = new WebSocket(
    `ws://localhost/trade-directory/auth/qr/ws?qrSessionId=${qrSessionId}`,
  );
  const authCodePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS timeout')), 20000);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      wsMessages.push(message);
      if (message.status === 'AUTH_SUCCESS') {
        clearTimeout(timer);
        resolve(message.authCode);
      }
    };
    ws.onerror = (e) => {
      clearTimeout(timer);
      reject(new Error(`WS error: ${e.message ?? e}`));
    };
  });
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    setTimeout(() => reject(new Error('WS connect timeout')), 10000);
  });
  check('WebSocket connected through nginx', ws.readyState === 1);

  // "Phone" side: JWT + fresh passkey assertion
  const mobileUA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148';
  const reauth = await post('/auth/passkey/reauth-options', {}, { token: accessToken, userAgent: mobileUA });
  check('reauth-options requires + accepts JWT', reauth.status === 201 && !!reauth.data?.options?.challenge);

  const authorize = await post(
    '/auth/qr/authorize-mobile',
    {
      qrSessionId,
      pin,
      reauthSessionId: reauth.data.reauthSessionId,
      response: authenticator.makeAssertionResponse(reauth.data.options.challenge),
    },
    { token: accessToken, userAgent: mobileUA },
  );
  check('authorize-mobile succeeds', authorize.status === 201 && authorize.data?.success === true, JSON.stringify(authorize.data));

  const authCode = await authCodePromise;
  check('desktop received one-time auth code over WS', !!authCode);
  check(
    'WS payload carries no tokens',
    wsMessages.every((m) => !('token' in m) && !('accessToken' in m)),
  );

  const complete = await post('/auth/qr/complete', { qrSessionId, authCode });
  check('qr/complete mints desktop tokens', complete.status === 201 && !!complete.data?.accessToken, JSON.stringify(complete.data));
  check('qr/complete sets httpOnly refresh cookie', !!refreshCookie(complete.headers));

  const qrMe = await get('/api/person/me', complete.data.accessToken);
  check('desktop session works on /api/person/me', qrMe.status === 200 && qrMe.data?.email === TEST_EMAIL);

  const replayComplete = await post('/auth/qr/complete', { qrSessionId, authCode });
  check('auth code is single-use (401 on replay)', replayComplete.status === 401);

  // Wrong pin kills the whole session
  const qrInit2 = await post('/auth/qr/initiate', {});
  const url2 = new URL(qrInit2.data.loginUrl);
  const session2 = url2.searchParams.get('session');
  const pin2 = (url2.hash.match(/pin=([^&]+)/) ?? [])[1];

  const reauth2 = await post('/auth/passkey/reauth-options', {}, { token: accessToken, userAgent: mobileUA });
  const badPin = await post(
    '/auth/qr/authorize-mobile',
    {
      qrSessionId: session2,
      pin: 'wrong-pin-value-000000000000000',
      reauthSessionId: reauth2.data.reauthSessionId,
      response: authenticator.makeAssertionResponse(reauth2.data.options.challenge),
    },
    { token: accessToken, userAgent: mobileUA },
  );
  check('wrong pin rejected (403)', badPin.status === 403);

  const reauth3 = await post('/auth/passkey/reauth-options', {}, { token: accessToken, userAgent: mobileUA });
  const killedSession = await post(
    '/auth/qr/authorize-mobile',
    {
      qrSessionId: session2,
      pin: pin2,
      reauthSessionId: reauth3.data.reauthSessionId,
      response: authenticator.makeAssertionResponse(reauth3.data.options.challenge),
    },
    { token: accessToken, userAgent: mobileUA },
  );
  check('session killed after pin mismatch (410 even with right pin)', killedSession.status === 410);

  const unauthenticated = await post('/auth/qr/authorize-mobile', {
    qrSessionId: 'x',
    pin: 'y',
    reauthSessionId: 'z',
    response: {},
  });
  check('authorize-mobile requires JWT (403)', unauthenticated.status === 403);

  // ── Credential management ────────────────────────────────────────
  console.log('\n[4] Credential management + enrollment issuance');

  const list1 = await get('/auth/passkey/credentials', accessToken);
  check('credentials list shows the passkey', list1.status === 200 && list1.data?.length === 1 && list1.data[0].label === 'E2E soft authenticator', JSON.stringify(list1.data));

  const lastRevoke = await fetch(`${BASE}/auth/passkey/credentials/${list1.data[0].id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, Origin: ORIGIN },
  });
  check('revoking the only passkey is blocked (400)', lastRevoke.status === 400);

  // Add a second device (authenticated register-options, no enrollment token)
  const device2 = new SoftAuthenticator();
  const addOptions = await post('/auth/passkey/register-options', {}, { token: accessToken });
  check('add-device register-options works with JWT', addOptions.status === 201 && !!addOptions.data?.options?.challenge);
  const addVerify = await post('/auth/passkey/register-verify', {
    registrationSessionId: addOptions.data.registrationSessionId,
    response: device2.makeRegistrationResponse(addOptions.data.options.challenge),
    label: 'Second device',
  });
  check('second credential registered', addVerify.status === 201 && addVerify.data?.verified === true, JSON.stringify(addVerify.data));

  const rename = await fetch(`${BASE}/auth/passkey/credentials/${list1.data[0].id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Origin: ORIGIN,
    },
    body: JSON.stringify({ label: 'Renamed key' }),
  });
  check('rename credential works', rename.status === 200);

  const revoke = await fetch(`${BASE}/auth/passkey/credentials/${list1.data[0].id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}`, Origin: ORIGIN },
  });
  check('revoke works with a second credential present', revoke.status === 200);

  const list2 = await get('/auth/passkey/credentials', accessToken);
  check('revoked credential no longer listed', list2.status === 200 && list2.data?.length === 1 && list2.data[0].label === 'Second device');

  const revokedLogin = await post('/auth/passkey/login-options', {
    email: TEST_EMAIL,
    orgId: ORG_ID,
  });
  check(
    'revoked credential absent from allowCredentials',
    !(revokedLogin.data?.options?.allowCredentials ?? []).some(
      (c) => c.id === b64u(authenticator.credentialId),
    ),
  );

  // Enrollment issuance via API (test user holds SUPERUSER)
  const issue = await post(
    '/auth/passkey/enrollment-tokens',
    { email: TEST_EMAIL },
    { token: accessToken },
  );
  check('SUPERUSER can issue enrollment link', issue.status === 201 && !!issue.data?.enrollmentUrl, JSON.stringify(issue.data));

  const issueForStranger = await post(
    '/auth/passkey/enrollment-tokens',
    { email: 'tony.murphy@synlian.net' }, // SQFSYS — not a member of org 2
    { token: accessToken },
  );
  check('cannot issue for someone outside own org (403)', issueForStranger.status === 403);

  // ── Password login is gone ───────────────────────────────────────
  console.log('\n[5] Password login removal');
  const oldLogin = await post('/auth/login', {
    email: TEST_EMAIL,
    password: 'anything',
    orgId: ORG_ID,
  });
  check('POST /auth/login no longer exists (404)', oldLogin.status === 404);

  // ── Audit trail ──────────────────────────────────────────────────
  console.log('\n[6] Audit trail');
  const auditEvents = psql(
    `SELECT DISTINCT event FROM auth_audit_log WHERE email = '${TEST_EMAIL}' ORDER BY event`,
  )
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const expected = [
    'ENROLLMENT_TOKEN_ISSUED',
    'PASSKEY_LOGIN_FAILURE',
    'PASSKEY_LOGIN_SUCCESS',
    'PASSKEY_REGISTERED',
    'PASSKEY_REVOKED',
    'QR_LOGIN_APPROVED',
    'QR_LOGIN_COMPLETED',
  ];
  for (const event of expected) {
    check(`audit log has ${event}`, auditEvents.includes(event), `have: ${auditEvents.join(',')}`);
  }

  try {
    ws.close();
  } catch {
    /* already closed */
  }

  console.log(`\nDone: ${passed} passed, ${failed} failed`);
  console.log('Cleaning up test identity…');
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
