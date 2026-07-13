import { Module } from '@nestjs/common';
import { MARKITDOWN_SERVICE } from './markitdown.interface';
import { MarkitdownService } from './markitdown.service';

@Module({
  providers: [{ provide: MARKITDOWN_SERVICE, useClass: MarkitdownService }],
  exports: [MARKITDOWN_SERVICE],
})
export class MarkitdownModule {}
