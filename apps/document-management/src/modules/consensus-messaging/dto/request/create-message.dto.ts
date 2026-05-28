import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateMessageAttributes {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  dataType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  hash: string;
}

export class CreateMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  refId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  eventName: string;

  @ApiProperty({ type: [CreateMessageAttributes] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMessageAttributes)
  @ArrayMinSize(1)
  attributes: CreateMessageAttributes[];
}
