import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteApiKeyResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
