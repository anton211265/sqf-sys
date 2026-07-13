import { OnchainStatus } from './enum';

export const AUDIT_STATUS_LABELS: Record<OnchainStatus, string> = {
  [OnchainStatus.COMPLETED]: 'Completed',
  [OnchainStatus.PENDING_WEBHOOK]: 'Pending Webhook',
  [OnchainStatus.PARTIAL_COMPLETED]: 'Partial Completed',
  [OnchainStatus.FAILED]: 'Failed',
};
