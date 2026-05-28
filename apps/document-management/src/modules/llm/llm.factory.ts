import { Injectable } from '@nestjs/common';
import { DeepSeekService } from './deep-seek.service';
import { LLMProvider } from '@app/common/apps/common/enums/llm.enum';
import { ILLMService } from './llm.interface';

@Injectable()
export class LLMServiceFactory {
  constructor(private readonly deepSeekService: DeepSeekService) {}

  getService(provider: LLMProvider): ILLMService {
    switch (provider) {
      case LLMProvider.DEEPSEEK:
        return this.deepSeekService;
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
