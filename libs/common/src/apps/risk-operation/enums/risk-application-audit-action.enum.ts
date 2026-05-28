export enum RiskApplicationAuditActionEnum {
  MANUAL_REVIEW_STARTED = 'MANUAL_REVIEW_STARTED',
  MANUAL_REVIEW_APPROVED = 'MANUAL_REVIEW_APPROVED',
  MANUAL_REVIEW_REJECTED = 'MANUAL_REVIEW_REJECTED',
  SCORE_RECALCULATED = 'SCORE_RECALCULATED',
  PROFILE_ASSIGNED = 'PROFILE_ASSIGNED',
}

export const RiskApplicationAuditActionLabels: Record<
  RiskApplicationAuditActionEnum,
  string
> = {
  MANUAL_REVIEW_STARTED: 'Started Manual Review',
  MANUAL_REVIEW_APPROVED: 'Approved Manual Review',
  MANUAL_REVIEW_REJECTED: 'Rejected Manual Review',
  SCORE_RECALCULATED: 'Re-run Threshold Check',
  PROFILE_ASSIGNED: 'Risk Profile Assigned',
};
