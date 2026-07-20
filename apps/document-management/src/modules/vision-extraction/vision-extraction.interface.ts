export const VISION_EXTRACTION_SERVICE = 'VISION_EXTRACTION_SERVICE';

export interface IVisionExtractionService {
  /**
   * Transcribe a document with no embedded text layer (scanned/photographed PDF,
   * PNG, JPEG) to Markdown using a multimodal LLM, as a fallback for when
   * Markitdown's text-layer-only extraction comes back empty.
   *
   * Unlike dedicated OCR, this is a generative read of the page images, not a
   * deterministic pixel-to-character mapping — it carries no confidence score
   * and can misread fields (most riskily, numeric ones: amounts, account
   * numbers, registration numbers). Per the 2026-07-19 redesign decision,
   * vision-sourced invoices are gated by the deterministic arithmetic check
   * (line math must reconcile to the stated total) rather than blanket human
   * review — mismatches route to manual reconciliation. The legacy
   * document-extraction pipeline's PENDING_REVIEW human gate still applies
   * until that pipeline is torn down.
   *
   * @param file - the raw file bytes
   * @param mime - the file's mime type (application/pdf, image/png, image/jpeg)
   */
  transcribeToMarkdown(file: Buffer, mime: string): Promise<string>;
}
