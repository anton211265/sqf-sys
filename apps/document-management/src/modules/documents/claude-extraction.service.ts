import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { DocumentClassEnum } from '@app/common/apps/document-management/enums/document-class.enum';
import { EXTRACTION_TARGETS } from './extraction-targets';

// Claude field extraction — replaces the DeepSeek + per-org prompt-template
// system (design decision 2026-07-19: extraction targets are fixed per
// document class, not tenant-configurable templates).
@Injectable()
export class ClaudeExtractionService {
  private readonly logger = new Logger(ClaudeExtractionService.name);
  private readonly anthropic: Anthropic;
  private readonly model: string;

  constructor(configService: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
    this.model = configService.getOrThrow('ANTHROPIC_MODEL');
  }

  async extractFields(
    rawText: string,
    documentClass: DocumentClassEnum,
  ): Promise<Record<string, unknown>> {
    const target = EXTRACTION_TARGETS[documentClass];
    if (!target) {
      throw new InternalServerErrorException(
        `No extraction target defined for document class ${documentClass}`,
      );
    }

    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4096,
      temperature: 0,
      system: `You extract structured data from ${target.description}.

Return ONLY a JSON object matching exactly this shape — no markdown fences, no commentary:
${target.jsonShape}

Rules:
- A value that is absent or illegible in the document is null. Never guess or invent.
- Amounts are plain JSON numbers with no thousands separators or currency symbols.
- Dates are ISO 8601 (YYYY-MM-DD).
- Currency is the ISO 4217 code (e.g. "MYR", "EUR").
- Transcribe identifiers (registration numbers, account numbers, invoice numbers) character-for-character.`,
      messages: [
        {
          role: 'user',
          content: `Extract the fields from this document:\n\n${rawText}`,
        },
        // No assistant prefill — current models reject it. parseJson's
        // brace-bounding tolerates commentary/fences around the object.
      ],
    });

    const block = response.content.find((c) => c.type === 'text');
    if (!block || block.type !== 'text') {
      throw new InternalServerErrorException(
        'Claude returned no text content for field extraction',
      );
    }

    return this.parseJson(block.text);
  }

  // Parses the brace-bounded object, tolerating trailing text after it.
  private parseJson(text: string): Record<string, unknown> {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    const candidate =
      start >= 0 && end > start ? text.slice(start, end + 1) : text.trim();
    try {
      return JSON.parse(candidate);
    } catch (error) {
      this.logger.error(
        `Failed to parse extraction JSON: ${candidate.slice(0, 200)}`,
      );
      throw new InternalServerErrorException(
        'Claude extraction did not return valid JSON',
      );
    }
  }
}
