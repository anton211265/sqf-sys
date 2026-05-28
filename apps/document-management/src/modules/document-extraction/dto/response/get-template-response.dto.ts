import { ApiProperty } from '@nestjs/swagger';

export class PromptDto {
  @ApiProperty()
  format: string;

  @ApiProperty()
  keyToExtract: string;

  @ApiProperty()
  description: string;
}

export class GetTemplateResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  llmProvider: string;

  @ApiProperty()
  prompt: PromptDto[];
}
