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
  RISK_PROFILES: '/config/risk-profiles',
};

// Credit Risk & Compliance domain — risk-operation /api/crc (Filter-2 risk
// models + assessments; risk-points orientation).
export const CRC = {
  DASHBOARD: '/crc/dashboard',
  MODELS: '/crc/risk-models',
  MODEL_DETAIL: '/crc/risk-models/:id',
  ASSESSMENTS: '/crc/assessments',
};

// CRM domain — customer-relationship-management service.
export const CRM = {
  SUPERVISOR: '/crm/supervisor',
  PIPELINE: '/crm/pipeline',
  SITE_VISITS: '/crm/site-visits',
  APPLICANTS: '/crm/applicants',
  CLIENTS: '/crm/clients',
};
