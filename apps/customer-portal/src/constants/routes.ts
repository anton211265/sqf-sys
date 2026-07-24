// Customer Portal routes (client-facing app, origin :3003). Gating is
// org membership — clients never hold funder permission keys; see
// docs/design/customer-portal-annotation.md.
export const AUTH = {
  LOGIN: '/auth/login',
  // One-time passkey enrollment (link carries #token=... in the fragment)
  ENROLL: '/enroll',
};

export const PUBLIC = {
  DISCLAIMER: '/apply/disclaimer',
  REGISTER: '/apply/register',
  REGISTERED: '/apply/check-email',
};

export const PORTAL = {
  HOME: '/',
  APPLICATION: '/application',
  STATUS: '/application/status',
  OFFER: '/offer',
  AGREEMENT: '/agreement',
};

// Alias kept so the shared Login screen (ported from web-next) lands Home
// after sign-in without divergence.
export const HOME = PORTAL.HOME;
