import Anthropic from '@anthropic-ai/sdk';

/**
 * Four-layer tool contracts (name/description/input_schema — error_contract
 * enforced by the executor catching and returning {error} to the model)
 * per the Schema Agent pattern in root AGENT.md. Read tools wrap
 * risk-operation; checkCompliance wraps the stubbed Filter 2 provider;
 * proposeRecommendation is the only "write" tool, and it writes to the
 * Risk Agent's own DB, never to risk-operation.
 */
export const GET_FINANCIAL_CREDIT_REPORT_TOOL: Anthropic.Tool = {
  name: 'get_financial_credit_report',
  description:
    "Fetch the client organization's extracted financial metrics (debt/equity, liquidity, EBITDA, etc.) used for Filter 2 quantitative scoring.",
  input_schema: {
    type: 'object',
    properties: { organizationId: { type: 'number' } },
    required: ['organizationId'],
  },
};

export const CHECK_COMPLIANCE_TOOL: Anthropic.Tool = {
  name: 'check_compliance',
  description:
    "Run sanctions/adverse-media/social-media checks on a named person or organization (director, shareholder, the client org itself). Currently backed by a stubbed provider for the local prototype — real OFAC/media integrations are a later phase.",
  input_schema: {
    type: 'object',
    properties: {
      subjectName: { type: 'string' },
      checks: {
        type: 'array',
        items: { type: 'string', enum: ['OFAC_SANCTIONS', 'ADVERSE_MEDIA', 'SOCIAL_MEDIA'] },
      },
    },
    required: ['subjectName', 'checks'],
  },
};

export const PROPOSE_ORGANIZATION_KYC_OUTCOME_TOOL: Anthropic.Tool = {
  name: 'propose_organization_kyc_outcome',
  description:
    "Record the agent's KYC-intake recommendation for a newly auto-created, not-yet-vetted Organization. This does NOT change any verification status on the organization itself — it writes to the Risk Agent's own KYC recommendation log for a Human Risk Analyst to confirm or override. Call this exactly once to conclude your review.",
  input_schema: {
    type: 'object',
    properties: {
      outcome: { type: 'string', enum: ['CLEAR', 'FLAGGED'] },
      confidence: { type: 'number', minimum: 0, maximum: 1 },
      reasoning: { type: 'array', items: { type: 'string' } },
      escalate: { type: 'boolean' },
    },
    required: ['outcome', 'confidence', 'reasoning', 'escalate'],
  },
};

// Curated subset for an organization KYC-intake task — deliberately excludes
// every application-scoring tool below, which would be meaningless (and
// confusing to the model) outside an application-review context.
export const ORGANIZATION_KYC_TOOLS: Anthropic.Tool[] = [
  CHECK_COMPLIANCE_TOOL,
  GET_FINANCIAL_CREDIT_REPORT_TOOL,
  PROPOSE_ORGANIZATION_KYC_OUTCOME_TOOL,
];

export const RISK_AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_application',
    description:
      "Fetch a risk-operation Application record by id, including client org, facility, and applicationStatus.",
    input_schema: {
      type: 'object',
      properties: { applicationId: { type: 'number' } },
      required: ['applicationId'],
    },
  },
  {
    name: 'list_risk_models',
    description:
      'List all risk models (filter to riskModelStatus=PUBLISHED yourself when choosing one to assign) with their thresholds and factor structure.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_risk_profiles',
    description:
      'List all quantitative risk profiles (business sector, capital size, thresholds) available for Filter 2 assignment.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'assign_risk_model',
    description:
      'Assign a PUBLISHED qualitative risk model to the application, initializing the Filter 1 factor survey. Call this once, after deciding which model fits the org/product/amount.',
    input_schema: {
      type: 'object',
      properties: {
        applicationNumber: { type: 'string' },
        riskModelNumber: { type: 'string' },
      },
      required: ['applicationNumber', 'riskModelNumber'],
    },
  },
  {
    name: 'change_risk_profile',
    description:
      'Assign a quantitative risk profile (used for Filter 2 financial scoring) to the application.',
    input_schema: {
      type: 'object',
      properties: {
        applicationNumber: { type: 'string' },
        riskProfileCode: { type: 'string' },
      },
      required: ['applicationNumber', 'riskProfileCode'],
    },
  },
  {
    name: 'get_risk_application_scoring',
    description:
      'Fetch the current RiskApplicationScoring record: Filter 1 and Filter 2 scores/categories, isRiskSurveyCompleted, riskFilter1Status.',
    input_schema: {
      type: 'object',
      properties: { applicationNumber: { type: 'string' } },
      required: ['applicationNumber'],
    },
  },
  {
    name: 'get_manual_review_alerts',
    description:
      'Fetch threshold-breach manual review alerts generated for this application (Filter 1/Filter 2 quantitative breaches).',
    input_schema: {
      type: 'object',
      properties: { applicationNumber: { type: 'string' } },
      required: ['applicationNumber'],
    },
  },
  {
    name: 'run_quantitative_scoring',
    description:
      "Run quantitative Filter 1 scoring for this application against its currently-assigned risk profile (call this only after change_risk_profile). Computes riskFilter1TotalScore/Category on the RiskApplicationScoring record from the org's FinancialCreditReport.",
    input_schema: {
      type: 'object',
      properties: { applicationNumber: { type: 'string' } },
      required: ['applicationNumber'],
    },
  },
  {
    name: 'generate_manual_review_alerts',
    description:
      'Generate threshold-breach manual review alerts for this application based on the scores just computed by run_quantitative_scoring. Call this after run_quantitative_scoring, before concluding your filter selection task.',
    input_schema: {
      type: 'object',
      properties: { applicationNumber: { type: 'string' } },
      required: ['applicationNumber'],
    },
  },
  GET_FINANCIAL_CREDIT_REPORT_TOOL,
  CHECK_COMPLIANCE_TOOL,
  {
    name: 'propose_recommendation',
    description:
      "Record the agent's recommendation for a filter stage. This does NOT change risk-operation's records — it writes to the Risk Agent's own recommendation log for the Human Risk Analyst to confirm or override on the CRC dashboard. Call this exactly once to conclude your evaluation of a given filter stage.",
    input_schema: {
      type: 'object',
      properties: {
        filterStage: { type: 'string', enum: ['FILTER_1', 'FILTER_2'] },
        decision: { type: 'string', enum: ['APPROVE', 'REJECT', 'ESCALATE'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reasoning: { type: 'array', items: { type: 'string' } },
        escalate: { type: 'boolean' },
      },
      required: ['filterStage', 'decision', 'confidence', 'reasoning', 'escalate'],
    },
  },
];
