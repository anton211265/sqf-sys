import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  accessToken: string;

}
