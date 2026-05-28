import { BooleanTransformer } from '@app/common/utils/boolean-transformer';
import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GrantExperianConsentBodyDto {
  @ApiProperty()
  @IsBoolean()
  @BooleanTransformer()
  granted: boolean;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Optional()
  emailAddress?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Optional()
  mobileNumber?: string;
}
