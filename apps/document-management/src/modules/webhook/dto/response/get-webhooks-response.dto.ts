import { ApiProperty } from '@nestjs/swagger';
import { WebhookEventType } from 'apps/document-management/src/models/webhook.entity';
import { IsArray, IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GetWebhooksResponseDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  webhookId: string;

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
  createdAt: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  eventTypes: WebhookEventType[];
}
