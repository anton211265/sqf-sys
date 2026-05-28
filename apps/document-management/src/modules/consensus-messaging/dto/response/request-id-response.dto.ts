import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestIdResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  requestId: string;
}
