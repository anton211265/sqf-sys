import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskEvaluationParameterDto } from './dto/create-risk-evaluation-parameter.dto';
import { UpdateRiskEvaluationParameterDto } from './dto/update-risk-evaluation-parameter.dto';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskEvaluationParameter } from '../../models/risk-evaluation-parameter.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { RiskFactor } from '../../models/risk-factor.entity';

@Injectable()
export class RiskEvaluationParameterService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly riskEvaluationParameterRepository: RiskEvaluationParameterRepository,
    private readonly riskFactorRepository: RiskFactorRepository,
  ) {}

  async create(
    riskFactorId: number,
    createRiskEvaluationParameterDto: CreateRiskEvaluationParameterDto[],
    queryRunner: QueryRunner,
  ) {
    // Query the risk factor using the same transaction
    const getRiskFactor = await queryRunner.manager.findOne(RiskFactor, {
      where: { id: riskFactorId },
    });

    if (!getRiskFactor) {
      throw new NotFoundException(
        `Risk Factor with riskFactorId: ${riskFactorId} not found.`,
      );
    }

    try {
      for (const param of createRiskEvaluationParameterDto) {
        const newRiskEvaluationParameter = new RiskEvaluationParameter({
          riskFactorId: getRiskFactor.id,
          parentId: null, // Main evaluation parameter has no parent
          name: param.name,
          description: param.description || null,
          weight: param.weight,
          riskCategory: param.riskCategory || null,
          scoreType: param.scoreType || null,
          fixedScore: param.scoreType === 'FIXED' ? param.fixedScore : null, // Only store if FIXED
          scoreRangeMin:
            param.scoreType === 'RANGE' ? param.scoreRangeMin : null, // Only store if RANGE
          scoreRangeMax:
            param.scoreType === 'RANGE' ? param.scoreRangeMax : null, // Only store if RANGE
        });

        const createdRiskEvaluationParameter = await queryRunner.manager.save(
          newRiskEvaluationParameter,
        );

        // Store sub-evaluation parameters (if any)
        if (param.subEvaluationParams?.length) {
          await this.createSubEvaluationParameters(
            createdRiskEvaluationParameter.id, // Parent ID for sub-evaluation parameters
            param.subEvaluationParams,
            queryRunner, // Pass transaction runner
          );
        }
      }

      return {
        message: 'New Risk Evaluation Parameter has been created successfully.',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      console.error('Error storing risk evaluation parameters:', error);

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store risk evaluation parameters`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async createSubEvaluationParameters(
    parentId: number,
    subEvalParams: CreateRiskEvaluationParameterDto[],
    queryRunner: QueryRunner,
  ) {
    const newSubEvaluation = subEvalParams.map((subEvalParam) => {
      return new RiskEvaluationParameter({
        riskFactorId: null,
        parentId: parentId,
        name: subEvalParam.name,
        description: subEvalParam.description || null,
        weight: subEvalParam.weight || null,
        riskCategory: subEvalParam.riskCategory || null,
        scoreType: subEvalParam.scoreType,
        fixedScore:
          subEvalParam.scoreType === 'FIXED' ? subEvalParam.fixedScore : null,
        scoreRangeMin:
          subEvalParam.scoreType === 'RANGE'
            ? subEvalParam.scoreRangeMin
            : null,
        scoreRangeMax:
          subEvalParam.scoreType === 'RANGE'
            ? subEvalParam.scoreRangeMax
            : null,
      });
    });

    // Save all sub-evaluation parameters in bulk inside the transaction
    const savedSubEvaluation = await queryRunner.manager.save(newSubEvaluation);

    // Recursively insert deeper sub-factors (supports multiple nested levels)
    for (let i = 0; i < savedSubEvaluation.length; i++) {
      if (subEvalParams[i].subEvaluationParams?.length) {
        await this.createSubEvaluationParameters(
          savedSubEvaluation[i].id, // Assign newly created sub-factor ID as the parent
          subEvalParams[i].subEvaluationParams,
          queryRunner,
        );
      }
    }
  }

  findAll() {
    return `This action returns all riskEvaluationParameter`;
  }

  findOne(id: number) {
    return `This action returns a #${id} riskEvaluationParameter`;
  }

  update(
    id: number,
    updateRiskEvaluationParameterDto: UpdateRiskEvaluationParameterDto,
  ) {
    return `This action updates a #${id} riskEvaluationParameter`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskEvaluationParameter`;
  }
}
