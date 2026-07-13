import { ApiProperty } from '@nestjs/swagger';

export class DocumentExtractinResponseDto {
  @ApiProperty()
  requestId: string;

  @ApiProperty()
  refId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  documentType: string;

  @ApiProperty({ nullable: true })
  fileName?: string;

  @ApiProperty({ nullable: true })
  extractedData?: Record<string, any>;

  @ApiProperty({ nullable: true })
  error?: string;

  @ApiProperty({ nullable: true })
  llmProvider?: string;

  @ApiProperty({ nullable: true })
  tokens?: number;

  @ApiProperty({ nullable: true })
  pages?: number;

  @ApiProperty({ nullable: true })
  rawText?: string;

  @ApiProperty({ nullable: true })
  extractionMethod?: string;

  @ApiProperty()
  createdAt: Date;
}
