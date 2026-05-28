import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTemplateResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
