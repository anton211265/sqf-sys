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

// Funder Administration Portal — RBAC trio (gate keys in PortalLayout's
// NAV_ITEMS; a route renders only if the manifest holds its key).
export const ADMIN = {
  ROLES: '/admin/roles',
  USERS: '/admin/users',
  AUDIT: '/admin/audit',
};

// Product Configuration domain — served by the product-configurator
// microservice; all screens gate on config_products_view.
export const CONFIG = {
  PRODUCTS: '/config/products',
  PRODUCT_DETAIL: '/config/products/:id',
  TEMPLATES: '/config/legal-templates',
  AUDIT: '/config/audit',
  BILLING: '/config/billing',
  CALENDAR: '/config/calendar',
  POLICIES: '/config/policies',
};
