import { Injectable } from '@nestjs/common';
import { ILLMService } from './llm.interface';
import OpenAI from 'openai';
import { PromptField } from '../../models/prompt-template.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeepSeekService implements ILLMService {
  private openAi: OpenAI;

  constructor(private readonly configService: ConfigService) {
    const deepSeekUrl = this.configService.getOrThrow('DEEP_SEEK_URL');
    const deepSeekApiKey = this.configService.getOrThrow('DEEP_SEEK_API_KEY');

    this.openAi = new OpenAI({ baseURL: deepSeekUrl, apiKey: deepSeekApiKey });
  }

  async extractData(
    rawText: string,
    prompts: PromptField[],
  ): Promise<{ extractedData: Record<string, any>; tokens: number }> {
    const fieldLines = prompts
      .map((p) => `• "${p.keyToExtract}" (${p.format}): ${p.description}`)
      .join('\n');

    const promptContent = `
      You are a backend service that analyzes input text and returns a **valid JSON object**.
      
      **Use the following field names exactly as the keys in your JSON output:**
      
      ${fieldLines}

      If you cannot extract a value for a field, include it in the JSON with a value of \`null\`.
      
      Now, here is the text to analyze:
      
      \`\`\`text
      ${rawText.replace(/```/g, '')}
      \`\`\`
      
      Please output **only** the JSON object, nothing else.
      `.trim();

    const completion = await this.openAi.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: promptContent,
        },
      ],
      model: 'deepseek-chat',
    });

    let cleaned = completion.choices[0].message.content
      .replace(/```json/g, '')
      .trim();

    cleaned = cleaned.replace(/```/g, '').trim();

    const tokens = completion.usage.total_tokens;

    return { extractedData: JSON.parse(cleaned), tokens };
  }
}
