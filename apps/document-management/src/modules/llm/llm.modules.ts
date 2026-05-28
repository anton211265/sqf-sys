import { DeepSeekService } from './deep-seek.service';
import { Module } from '@nestjs/common';
import { LLMServiceFactory } from './llm.factory';

@Module({
  providers: [DeepSeekService, LLMServiceFactory],
  exports: [LLMServiceFactory],
})
export class LLMModule {}
