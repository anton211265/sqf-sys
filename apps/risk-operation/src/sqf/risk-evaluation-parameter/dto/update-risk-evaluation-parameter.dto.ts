import { PartialType } from '@nestjs/swagger';
import { CreateRiskEvaluationParameterDto } from './create-risk-evaluation-parameter.dto';

export class UpdateRiskEvaluationParameterDto extends PartialType(CreateRiskEvaluationParameterDto) {}
