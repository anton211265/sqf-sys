export const DOCUMENT_MANAGEMENT_CRON_SERVICE =
  'DOCUMENT MANAGEMENT CRON SERVICE';

export interface IDocumentManagementCronService {
  /**
   * handle documents that are opending llm extraction
   */
  handlePendingLLMExtractionCron(): Promise<void>;

  /**
   * handle pending extraction webhook
   */
  handlePendingExtractionWebhookCron(): Promise<void>;

  /**
   * handle pending consensus messaging webhook
   */
  handlePendingConsensusMessagingWebhookCron(): Promise<void>;
}
