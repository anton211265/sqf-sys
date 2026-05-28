import { PartialType } from '@nestjs/swagger';
import { CreateRiskManualReviewAlertDto } from './create-risk-manual-review-alert.dto';

export class UpdateRiskManualReviewAlertDto extends PartialType(CreateRiskManualReviewAlertDto) {}
