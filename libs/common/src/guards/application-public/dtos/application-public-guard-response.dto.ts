import { Application } from '@app/common/apps/risk-operation/types/application.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ApplicationPublicGuardResponseDto {
  @ApiProperty()
  @IsInt()
  applicationPublicId: number;

  @ApiProperty()
  @IsInt()
  applicationId: number;

  @ApiProperty()
  @IsInt()
  clientPersonaId: number;

  application: Application;
}
