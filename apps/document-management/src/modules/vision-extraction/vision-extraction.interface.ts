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
   * numbers, registration numbers). Callers MUST treat the result as requiring
   * human review before it's trusted for downstream LLM field extraction.
   *
   * @param file - the raw file bytes
   * @param mime - the file's mime type (application/pdf, image/png, image/jpeg)
   */
  transcribeToMarkdown(file: Buffer, mime: string): Promise<string>;
}
