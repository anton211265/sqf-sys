import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import axiosClient, { setAccessToken } from 'api/axiosClient';
import { BASE_URL } from 'constants/constant';
import { getApiResponseErrorMsg } from 'utils/apiHelper';

// WebAuthn passkey auth — the only login method since password removal
// (2026-07-22). Native flow first (Touch ID / Windows Hello / browser
// cross-device QR); the custom QR relay below covers machines with no
// usable authenticator.

export const isWebAuthnSupported = (): boolean => browserSupportsWebAuthn();

/** True for errors that mean "this device can't do passkeys", as opposed to
 * the user cancelling the prompt (NotAllowedError). Used to decide whether
 * to auto-offer the QR fallback. */
export const isUnsupportedError = (e: unknown): boolean => {
  const name = (e as { name?: string })?.name ?? '';
  return name === 'NotSupportedError' || name === 'SecurityError' || !isWebAuthnSupported();
};

export interface IPasskeyLoginRequest {
  email: string;
  orgId: number;
}

export const passkeyLogin = async ({
  email,
  orgId,
}: IPasskeyLoginRequest): Promise<{ accessToken: string }> => {
  let optionsRes;
  try {
    optionsRes = await axiosClient().post(
      '/trade-directory/auth/passkey/login-options',
      { email, orgId },
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }

  // Browser-native prompt — throws DOMExceptions the caller classifies
  const assertion = await startAuthentication(optionsRes.data.options);

  try {
    const verifyRes = await axiosClient().post(
      '/trade-directory/auth/passkey/login-verify',
      { loginSessionId: optionsRes.data.loginSessionId, response: assertion },
      { headers: { 'Content-Type': 'application/json' } },
    );
    setAccessToken(verifyRes.data.accessToken);
    return verifyRes.data;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

export const enrollPasskey = async (
  enrollmentToken: string,
  label?: string,
): Promise<{ verified: boolean; email: string }> => {
  let optionsRes;
  try {
    optionsRes = await axiosClient().post(
      '/trade-directory/auth/passkey/register-options',
      { enrollmentToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }

  const attestation = await startRegistration(optionsRes.data.options);

  try {
    await axiosClient().post(
      '/trade-directory/auth/passkey/register-verify',
      {
        registrationSessionId: optionsRes.data.registrationSessionId,
        response: attestation,
        label,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
    return { verified: true, email: optionsRes.data.email };
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

// --------------------------------------------------------------------
// QR cross-device fallback
// --------------------------------------------------------------------

export interface IQrSession {
  qrSessionId: string;
  expiresInSeconds: number;
  loginUrl: string;
}

export const qrInitiate = async (): Promise<IQrSession> => {
  try {
    const response = await axiosClient().post(
      '/trade-directory/auth/qr/initiate',
      {},
      { headers: { 'Content-Type': 'application/json' } },
    );
    return response.data;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

/** Desktop side: listen for the one-time auth code. The socket only ever
 * carries the code — tokens are exchanged over HTTPS in qrComplete so the
 * refresh token can land in its httpOnly cookie. */
export const openQrSocket = (
  qrSessionId: string,
  handlers: {
    onAuthCode: (authCode: string) => void;
    onExpired: () => void;
    onInvalid: () => void;
  },
): WebSocket => {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  const ws = new WebSocket(
    `${wsBase}/trade-directory/auth/qr/ws?qrSessionId=${qrSessionId}`,
  );
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.status === 'AUTH_SUCCESS' && message.authCode) {
      handlers.onAuthCode(message.authCode);
    } else if (message.status === 'SESSION_EXPIRED') {
      handlers.onExpired();
    } else if (message.status === 'SESSION_INVALID') {
      handlers.onInvalid();
    }
  };
  return ws;
};

export const qrComplete = async (
  qrSessionId: string,
  authCode: string,
): Promise<{ accessToken: string }> => {
  try {
    const response = await axiosClient().post(
      '/trade-directory/auth/qr/complete',
      { qrSessionId, authCode },
      { headers: { 'Content-Type': 'application/json' } },
    );
    setAccessToken(response.data.accessToken);
    return response.data;
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};

/** Phone side: fresh biometric proof, then approve the desktop session. */
export const approveQrLogin = async (
  qrSessionId: string,
  pin: string,
): Promise<void> => {
  let optionsRes;
  try {
    optionsRes = await axiosClient().post(
      '/trade-directory/auth/passkey/reauth-options',
      {},
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }

  const assertion = await startAuthentication(optionsRes.data.options);

  try {
    await axiosClient().post(
      '/trade-directory/auth/qr/authorize-mobile',
      {
        qrSessionId,
        pin,
        reauthSessionId: optionsRes.data.reauthSessionId,
        response: assertion,
      },
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    throw new Error(getApiResponseErrorMsg(e));
  }
};
