import { ApiProperty } from '@nestjs/swagger';
import { WebhookEventType } from 'apps/document-management/src/models/webhook.entity';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateWebhookDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(1, 64)
  apiKey: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(1, 64)
  secretKey: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one event type must be selected' })
  @IsEnum(WebhookEventType, { each: true, message: 'Invalid event type' })
  @Type(() => String)
  eventTypes: WebhookEventType[];

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
