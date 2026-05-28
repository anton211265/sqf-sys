import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AssignApplicationParamDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class AssignApplicationBodyDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  assigneePersonId: number;
}
