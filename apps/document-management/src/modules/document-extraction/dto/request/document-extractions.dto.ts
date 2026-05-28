import { ApiProperty } from '@nestjs/swagger';
import { DocumentExtractionStatus } from '../../../../models/document-extraction.entity';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class DocumentExtractions {
  @ApiProperty({
    required: false,
    enum: DocumentExtractionStatus,
    description: 'Optional parameter for filtering by status.',
  })
  @IsNotEmpty()
  @IsEnum(DocumentExtractionStatus)
  @IsOptional()
  status?: DocumentExtractionStatus;
}
