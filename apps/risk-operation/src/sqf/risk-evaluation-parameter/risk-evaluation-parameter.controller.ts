import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RiskEvaluationParameterService } from './risk-evaluation-parameter.service';
import { CreateRiskEvaluationParameterDto } from './dto/create-risk-evaluation-parameter.dto';
import { UpdateRiskEvaluationParameterDto } from './dto/update-risk-evaluation-parameter.dto';

@Controller('/api/risk-evaluation-parameter')
export class RiskEvaluationParameterController {
  constructor(
    private readonly riskEvaluationParameterService: RiskEvaluationParameterService,
  ) {}
}
