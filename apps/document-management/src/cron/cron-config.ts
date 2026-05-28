import { CronConfigInterface } from '@app/common/apps/common/interface/cron-config.interface';

export const HandlePendingOCRConfig: CronConfigInterface = {
  disabled: false,
  schedule: '0 * * * * *', // runs at 0 seconds of every minute
};

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
