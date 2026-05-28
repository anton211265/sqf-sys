import { ApiProperty } from '@nestjs/swagger';
import { WebhookLog } from 'apps/document-management/src/models/webhook-log.entity';
import { WebhookEventType } from 'apps/document-management/src/models/webhook.entity';
import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GetWebhookResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  secretKey: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  createdAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  eventTypes: WebhookEventType[];

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  logs: WebhookLog[];
}
