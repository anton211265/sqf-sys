import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { IVisionExtractionService } from './vision-extraction.interface';

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

const TRANSCRIPTION_PROMPT = `
Transcribe this document to Markdown as faithfully as possible. Preserve every
field, label, and value exactly as written — do not summarize, paraphrase, or
omit anything. Render tables as Markdown tables. Pay close attention to numbers
(amounts, account numbers, dates, registration numbers) — transcribe them
character-for-character. If a value is illegible, write [illegible] rather
than guessing. Output only the Markdown transcription, nothing else.
`.trim();

@Injectable()
export class VisionExtractionService implements IVisionExtractionService {
  private readonly logger = new Logger(VisionExtractionService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
    this.model = this.configService.getOrThrow('ANTHROPIC_MODEL');
  }

  async transcribeToMarkdown(file: Buffer, mime: string): Promise<string> {
    const data = file.toString('base64');

    try {
      let response;

      if (mime === 'application/pdf') {
        response = await this.anthropic.beta.messages.create({
          model: this.model,
          max_tokens: 8192,
          betas: ['pdfs-2024-09-25'],
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: { type: 'base64', media_type: 'application/pdf', data },
                },
                { type: 'text', text: TRANSCRIPTION_PROMPT },
              ],
            },
          ],
        });
      } else if (IMAGE_MIME_TYPES.has(mime)) {
        response = await this.anthropic.messages.create({
          model: this.model,
          max_tokens: 8192,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mime as 'image/png' | 'image/jpeg',
                    data,
                  },
                },
                { type: 'text', text: TRANSCRIPTION_PROMPT },
              ],
            },
          ],
        });
      } else {
        throw new Error(`Unsupported mime type for vision extraction: ${mime}`);
      }

      const textBlock = response.content.find((block) => block.type === 'text');

      return textBlock && 'text' in textBlock ? textBlock.text : '';
    } catch (error) {
      this.logger.error('Vision-LLM transcription failed', error);

      throw new InternalServerErrorException(
        'Failed to transcribe document via vision LLM',
      );
    }
  }
}
