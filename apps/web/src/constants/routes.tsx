/* ------------------------SQF.AI CONSTANT ROUTES------------------------ */

export const SYSTEM = {
  SETUP: '/system-setup',
};

export const AUTH = {
  LOGIN: '/auth/login',
  SETUPNEWPASSWORD: '/auth/set-password',
  // One-time passkey enrollment (link carries #token=... in the fragment)
  ENROLL: '/enroll',
  // Phone side of the QR cross-device login (?session=...#pin=...)
  MOBILE_AUTH: '/mobile-auth',
};

export const CLIENTONBOARDING = {
  NEWAPPLICATION: '/client/onboarding/application/create',
  WElCOMEPAGE: '/client/onboarding/welcome',
  APPLICATIONSTEPS: '/client/onboarding/application',
  INREVIEW: '/client/onboarding/application-in-review',
};

export const CLIENT_DASHBOARD = {
  DASHBOARD: '/client/dashboard',
  DOC_MGT_REFERENCE: '/client/reference',
  DOC_MGT_API_KEY: '/client/keys',
  DOC_MGT_WEBHOOKS: '/client/webhooks',
  DOC_MGT_WEBHOOK_DETAILS: '/client/webhook/:id',
  DOC_MGT_TEMPLATES: '/client/templates',
  DOC_MGT_EXTRACTIONS: '/client/extractions',
  DOC_MGT_CONSENSUS_MESSAGING: '/client/consensus-messaging',
  DOC_MGT_DOCUMENTATION: '/client/documentation',
};

export const AUTHORISESIGNATORY = {
  WElCOMEPAGE: '/signatory/onboarding/welcome',
  ESIGNATURESETUP: '/signatory/onboarding/e-signature',
  INREVIEW: '/signatory/onboarding/application-in-review',
  COMPLETED: '/signatory/onboarding/completed',
};

export const SUPER_ADMIN = {
  DASHBOARD: '/super-admin/dashboard',
  ORGANIZATION: '/super-admin/organization',
  USERS: '/super-admin/users',
};

// NOTE: paths deliberately avoid the '/trade-directory' prefix — the Vite dev
// proxy forwards the five backend service prefixes to the gateway (vite.config.ts).
export const TRADE_DIRECTORY = {
  HOME: '/directory',
  ORGANIZATION: '/directory/organizations/:organizationId',
  INVOICES: '/directory/invoices',
  CONTRACTS: '/directory/contracts',
  SUBSCRIPTIONS: '/directory/subscriptions',
  OPPORTUNITIES: '/directory/opportunities',
};

export const ADMIN = {
  DASHBOARD: '/admin/dashboard',
  RISKMODELS: '/risk-models',
  RISKMODELVIEW: '/risk-models/:riskModelId',
  ADD_RISK: '/add-risk',

  ORGANIZATIONS: '/organizations',
  ORGANIZATIONVIEW: '/organizations/:organizationId',
  ORGANIZATIONRISKSURVEYVIEW:
    '/organizations/:organizationId/risk-survey/:applicationNo',

  THRESHOLDRISKPROFILES: '/threshold-risk-profiles',
  ADD_THRESHOLDRISKPROFILES: '/threshold-risk-profiles/edit',
  THRESHOLDRISKPROFILESVIEW: '/threshold-risk-profiles/view',
};

/* ------------------------SQF.AI CONSTANT ROUTES------------------------ */
