export const MARKITDOWN_SERVICE = 'MARKITDOWN_SERVICE';

export interface IMarkitdownService {
  /**
   * Convert a document buffer (docx, xlsx, pptx, etc.) to Markdown via Microsoft Markitdown.
   * @param file - the raw file bytes
   * @param fileName - original file name, used to preserve the extension Markitdown dispatches on
   * @returns the converted Markdown text
   */
  convertToMarkdown(file: Buffer, fileName: string): Promise<string>;
}
