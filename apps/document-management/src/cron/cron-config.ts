import { CronConfigInterface } from '@app/common/apps/common/interface/cron-config.interface';

export const HandlePendingLLMExtractionConfig: CronConfigInterface = {
  disabled: false,
  schedule: '20 * * * * *',
};

export const HandlePendingExtractionWebhookConfig: CronConfigInterface = {
  disabled: false,
  schedule: '50 * * * * *',
};

export const HandlePendingConsensusMessagingWebhookConfig: CronConfigInterface =
  {
    disabled: false,
    schedule: '0 * * * * *',
  };
