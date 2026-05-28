import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { OnchainStatus } from 'apps/document-management/src/models/onchain.entity';

export class OnchainsDto {
  @ApiProperty({
    required: false,
    enum: OnchainStatus,
    description: 'Optional parameter for filtering by status.',
  })
  @IsNotEmpty()
  @IsEnum(OnchainStatus)
  @IsOptional()
  status?: OnchainStatus;
}
