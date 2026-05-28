import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AssignClientAssigneeParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class AssignClientAssigneeBodyDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  assigneePersonId: number;
}
