import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteTemplateResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
