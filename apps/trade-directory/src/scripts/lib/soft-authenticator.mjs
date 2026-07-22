// Software WebAuthn authenticator shared by the E2E suites
// (e2e-passkey.mjs, e2e-rbac.mjs): real P-256 keys, hand-built CBOR
// attestation objects and DER-signed assertions — the server runs its actual
// SimpleWebAuthn verification against these. Node >= 22.

import {
  createHash,
  createSign,
  generateKeyPairSync,
  randomBytes,
} from 'node:crypto';

export const b64u = (buf) => Buffer.from(buf).toString('base64url');
export const sha256 = (data) => createHash('sha256').update(data).digest();

// ---------------------------------------------------------------------
// Minimal CBOR encoder — only the shapes WebAuthn needs
// ---------------------------------------------------------------------
function cborUint(n) {
  if (n < 24) return Buffer.from([n]);
  if (n < 256) return Buffer.from([0x18, n]);
  throw new Error('uint too large for this encoder');
}
function cborInt(n) {
  if (n >= 0) return cborUint(n);
  const m = -1 - n;
  if (m < 24) return Buffer.from([0x20 | m]);
  throw new Error('negative int too small for this encoder');
}
function cborBytes(buf) {
  const header =
    buf.length < 24
      ? Buffer.from([0x40 | buf.length])
      : buf.length < 256
        ? Buffer.from([0x58, buf.length])
        : Buffer.from([0x59, buf.length >> 8, buf.length & 0xff]);
  return Buffer.concat([header, buf]);
}
function cborText(str) {
  const bytes = Buffer.from(str, 'utf8');
  const header =
    bytes.length < 24
      ? Buffer.from([0x60 | bytes.length])
      : Buffer.from([0x78, bytes.length]);
  return Buffer.concat([header, bytes]);
}
function cborMap(entries) {
  return Buffer.concat([
    Buffer.from([0xa0 | entries.length]),
    ...entries.flat(),
  ]);
}

export class SoftAuthenticator {
  constructor({ rpId = 'localhost', origin = 'http://localhost:3001' } = {}) {
    this.rpId = rpId;
    this.origin = origin;
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
    });
    this.privateKey = privateKey;
    const jwk = publicKey.export({ format: 'jwk' });
    this.x = Buffer.from(jwk.x, 'base64url');
    this.y = Buffer.from(jwk.y, 'base64url');
    this.credentialId = randomBytes(32);
    this.counter = 0;
  }

  coseKey() {
    // EC2, ES256, P-256
    return cborMap([
      [cborInt(1), cborInt(2)],
      [cborInt(3), cborInt(-7)],
      [cborInt(-1), cborInt(1)],
      [cborInt(-2), cborBytes(this.x)],
      [cborInt(-3), cborBytes(this.y)],
    ]);
  }

  makeRegistrationResponse(challenge) {
    const clientDataJSON = Buffer.from(
      JSON.stringify({
        type: 'webauthn.create',
        challenge,
        origin: this.origin,
        crossOrigin: false,
      }),
    );
    const flags = 0x45; // UP | UV | AT
    const authData = Buffer.concat([
      sha256(this.rpId),
      Buffer.from([flags]),
      Buffer.alloc(4), // sign count 0
      Buffer.alloc(16), // AAGUID
      Buffer.from([this.credentialId.length >> 8, this.credentialId.length & 0xff]),
      this.credentialId,
      this.coseKey(),
    ]);
    const attestationObject = cborMap([
      [cborText('fmt'), cborText('none')],
      [cborText('attStmt'), cborMap([])],
      [cborText('authData'), cborBytes(authData)],
    ]);
    return {
      id: b64u(this.credentialId),
      rawId: b64u(this.credentialId),
      type: 'public-key',
      clientExtensionResults: {},
      response: {
        clientDataJSON: b64u(clientDataJSON),
        attestationObject: b64u(attestationObject),
        transports: ['internal'],
      },
    };
  }

  makeAssertionResponse(challenge, counterOverride = null) {
    this.counter = counterOverride ?? this.counter + 1;
    const clientDataJSON = Buffer.from(
      JSON.stringify({
        type: 'webauthn.get',
        challenge,
        origin: this.origin,
        crossOrigin: false,
      }),
    );
    const flags = 0x05; // UP | UV
    const counterBuf = Buffer.alloc(4);
    counterBuf.writeUInt32BE(this.counter);
    const authenticatorData = Buffer.concat([
      sha256(this.rpId),
      Buffer.from([flags]),
      counterBuf,
    ]);
    const signer = createSign('sha256');
    signer.update(Buffer.concat([authenticatorData, sha256(clientDataJSON)]));
    const signature = signer.sign(this.privateKey); // DER, as WebAuthn expects
    return {
      id: b64u(this.credentialId),
      rawId: b64u(this.credentialId),
      type: 'public-key',
      clientExtensionResults: {},
      response: {
        clientDataJSON: b64u(clientDataJSON),
        authenticatorData: b64u(authenticatorData),
        signature: b64u(signature),
        userHandle: null,
      },
    };
  }
}
