import { WebhookEventType, WebhookLogStatus } from './enum';

export const EVENT_LABELS: Record<WebhookEventType, string> = {
  [WebhookEventType.EXTRACTION]: 'Extraction',
  [WebhookEventType.CONSENSUS_MESSAGING]: 'Consensus Messaging',
};

export const STATUS_LABELS: Record<WebhookLogStatus, string> = {
  [WebhookLogStatus.SENT]: 'Sent',
  [WebhookLogStatus.FAILED]: 'Failed',
};
