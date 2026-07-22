// Deliberately minimal — only enough for the auth chassis. Real domain
// routes get added as the storyboard defines each screen; see CLAUDE.md
// "Planned: Frontend Rebuild" for the reprioritized-scope decision.
export const AUTH = {
  LOGIN: '/auth/login',
  // One-time passkey enrollment (link carries #token=... in the fragment)
  ENROLL: '/enroll',
  // Phone side of the QR cross-device login (?session=...#pin=...)
  MOBILE_AUTH: '/mobile-auth',
};

export const HOME = '/';
