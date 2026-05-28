import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApiKeyResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
