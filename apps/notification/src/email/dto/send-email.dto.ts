import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

class SendEmailEmailTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    type: 'object',
    properties: {
      key: {
        type: 'string',
      },
    },
  })
  @IsObject()
  templateVariables: Record<string, string>;
}

export class SendEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  emailSender: string;

  @ApiProperty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  emailReceivers: string[];

  @ApiProperty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  emailCc?: string[];

  @ApiProperty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  emailBcc?: string[];

  @ApiProperty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsOptional()
  emailReplyTo?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  emailSubject?: string;

  @ApiProperty({
    type: SendEmailEmailTemplateDto,
  })
  @Type(() => SendEmailEmailTemplateDto)
  @IsOptional()
  emailTemplate?: SendEmailEmailTemplateDto;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  emailBody?: string;
}
