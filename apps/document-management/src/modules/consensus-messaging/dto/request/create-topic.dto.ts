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

export class CreateTopicAttributes {
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

export class CreateTopicDto {
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

  @ApiProperty({ type: [CreateTopicAttributes] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTopicAttributes)
  @ArrayMinSize(1)
  attributes: CreateTopicAttributes[];
}
