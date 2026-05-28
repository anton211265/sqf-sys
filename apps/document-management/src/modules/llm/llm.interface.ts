import { PromptField } from '../../models/prompt-template.entity';

export interface ILLMService {
  /**
   * Extracts structured data from raw text based on a stored prompt template.
   * @param rawText - The text extracted via OCR.
   * @param prompts - The prompts array.
   */
  extractData(
    rawText: string,
    prompts: PromptField[],
  ): Promise<{ extractedData: Record<string, any>; tokens: number }>;
}
