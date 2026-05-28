import { ApiProperty } from '@nestjs/swagger';
import { DocumentExtractionStatus } from 'apps/document-management/src/models/document-extraction.entity';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class GetDocumentsDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(DocumentExtractionStatus)
  status?: DocumentExtractionStatus;
}
