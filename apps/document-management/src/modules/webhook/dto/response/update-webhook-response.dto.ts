import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateWebhookResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
