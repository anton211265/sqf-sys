import { ApiProperty } from '@nestjs/swagger';

export class PromptDto {
  @ApiProperty()
  format: string;

  @ApiProperty()
  keyToExtract: string;

  @ApiProperty()
  description: string;
}

export class GetTemplatesResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  llmProvider: string;

  @ApiProperty()
  numberOfPrompts: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  prompt: PromptDto[];
}
