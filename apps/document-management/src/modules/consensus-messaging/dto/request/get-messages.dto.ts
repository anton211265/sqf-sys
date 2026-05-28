import { ApiProperty } from '@nestjs/swagger';
import { OnchainStatus } from 'apps/document-management/src/models/onchain.entity';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class GetMessagesDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsOptional()
  @IsEnum(OnchainStatus)
  status?: OnchainStatus;
}
