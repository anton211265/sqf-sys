import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CommonRefIdType {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  refId?: string;
}

export class CommonRefType {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  refId?: string;
}
