import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTemplateResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
