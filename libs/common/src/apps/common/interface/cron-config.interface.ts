import { CronExpression } from '@nestjs/schedule';

export interface CronConfigInterface {
  disabled: boolean;
  schedule: CronExpression | string;
}
