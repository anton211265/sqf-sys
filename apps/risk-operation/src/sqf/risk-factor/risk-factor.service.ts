import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskFactorDto } from './dto/create-risk-factor.dto';
import { UpdateRiskFactorDto } from './dto/update-risk-factor.dto';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { RiskFactor } from '../../models/risk-factor.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { RiskEvaluationParameterService } from '../risk-evaluation-parameter/risk-evaluation-parameter.service';
import { RiskEvaluationParameterRepository } from '../../repositories/risk-evaluation-parameter.repository';
import { GetAllRiskFactorDto } from './dto/get-all-risk-factor.dto';

@Injectable()
export class RiskFactorService {
  constructor(
    private readonly riskModelRepository: RiskModelRepository,
    private readonly riskFactorRepository: RiskFactorRepository,
    private readonly riskEvaluationParameterRepository: RiskEvaluationParameterRepository,
    private readonly riskEvaluationParameterService: RiskEvaluationParameterService,
    @InjectDataSource() private readonly dataSource: DataSource, // Inject DataSource
  ) {}

  async create(
    createRiskFactorDto: CreateRiskFactorDto,
    riskModelNumber: string,
  ) {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Fetch the Risk Model to make sure it exists
      const getRiskModel = await this.riskModelRepository.findOne({
        where: { riskModelNumber: riskModelNumber },
      });

      // Throw error if Risk Model not found
      if (!getRiskModel) {
        throw new NotFoundException(
          `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
        );
      }

      // Store Main Risk Factor
      const createdRiskFactor = await this.createRiskFactor(
        createRiskFactorDto,
        getRiskModel.id,
        null, // Parent ID is null for main factor
        queryRunner,
      );

      // Store Sub-Factors
      if (createRiskFactorDto.subFactors?.length) {
        await this.createSubFactors(
          getRiskModel.id,
          createdRiskFactor.id,
          createRiskFactorDto.subFactors,
          queryRunner,
        );
      }

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        message: 'New Risk Factor has been created successfully.',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // If any operation fails, rollback the transaction to prevent partial inserts
      await queryRunner.rollbackTransaction();
      console.error('Error storing riskFactors: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store riskFactors`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  /**
   * Recursively stores sub-factors
   */
  private async createSubFactors(
    riskModelId: number,
    parentId: number,
    subFactors: CreateRiskFactorDto[],
    queryRunner: QueryRunner,
  ) {
    for (const subFactor of subFactors) {
      const createdSubFactor = await this.createRiskFactor(
        subFactor,
        riskModelId,
        parentId,
        queryRunner,
      );

      // Recursively insert deeper sub-factors
      if (subFactor.subFactors?.length) {
        await this.createSubFactors(
          riskModelId,
          createdSubFactor.id,
          subFactor.subFactors,
          queryRunner,
        );
      }
    }
  }

  /**
   * Helper function to store a single risk factor
   */
  private async createRiskFactor(
    factorDto: CreateRiskFactorDto,
    riskModelId: number,
    parentId: number | null,
    queryRunner: QueryRunner,
  ) {
    // Normalize Country List Data
    const countryList = factorDto.countryList
      ? {
          highRisk: factorDto.countryList.highRisk || [],
          mediumRisk: factorDto.countryList.mediumRisk || [],
          lowRisk: factorDto.countryList.lowRisk || [],
        }
      : null;

    // Ensure categories have sub-factors
    if (factorDto.isSetAsCategory) {
      factorDto.hasSubFactor = true;
      factorDto.isRequireEvaluationParameter = null;
    }

    const newRiskFactor = new RiskFactor({
      riskModelId,
      parentId,
      riskFactorName: factorDto.riskFactorName,
      description: factorDto.description || null,
      weight: factorDto.weight,
      isSetAsCategory: factorDto.isSetAsCategory ? 1 : 0,
      hasSubFactor: factorDto.hasSubFactor ? 1 : 0,
      tabName: factorDto.tabName,
      scoreMethod: factorDto.scoreMethod,
      isRequireEvaluationParameter: factorDto.isRequireEvaluationParameter
        ? 1
        : 0,
      scoreRangeMin: factorDto.scoreRangeMin,
      scoreRangeMax: factorDto.scoreRangeMax,
      countryList,
    });

    const createdFactor = await queryRunner.manager.save(newRiskFactor);

    // Store Evaluation Parameters
    if (factorDto.evaluationParameters?.length) {
      await this.riskEvaluationParameterService.create(
        createdFactor.id,
        factorDto.evaluationParameters,
        queryRunner,
      );
    }

    return createdFactor;
  }

  async findAll(
    riskModelNumber: string,
    getAllRiskFactorDto: GetAllRiskFactorDto,
  ) {
    const getRiskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber: riskModelNumber },
    });

    if (!getRiskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
      );
    }

    const riskModelId = getRiskModel.id;

    try {
      const riskFactors = await this.riskFactorRepository.find({
        where: { riskModelId: riskModelId },
        relations: [
          'riskEvaluationParameters',
          ...(getAllRiskFactorDto.includeRiskFactorScoring
            ? ['riskFactorScorings']
            : []),
        ],
      });

      const evalParams =
        (await this.riskEvaluationParameterRepository.find()) || [];

      return {
        message: `Risk factors for riskModelNumber: ${riskModelNumber} retrieved successfully.`,
        statusCode: HttpStatus.OK,
        data: this.buildNestedTree(
          riskFactors,
          evalParams,
          getAllRiskFactorDto.includeRiskFactorScoring,
        ),
      };
    } catch (error) {
      console.error('Error fetching risk factors:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve risk factors for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildNestedTree(
    riskFactors: any[] = [],
    evaluationParams: any[] = [],
    includeRiskFactorScoring: boolean = false,
  ) {
    const riskFactorMap = new Map(); // Store risk factors by ID
    const evalParamMap = new Map(); // Store evaluation parameters by ID
    const topLevelRiskFactors = []; // Store top-level risk factors

    // Prepare risk factors and store them in a map
    for (const risk of riskFactors) {
      riskFactorMap.set(risk.id, {
        ...risk,
        isSetAsCategory: risk.isSetAsCategory === 1, // Convert 1/0 to true/false
        hasSubFactor: risk.hasSubFactor === 1,
        isRequireEvaluationParameter: risk.isRequireEvaluationParameter === 1,
        subFactors: [], // Will store nested sub-risk factors
        riskEvaluationParameters: [], // Ensure it exists
        riskFactorScorings: includeRiskFactorScoring
          ? risk.riskFactorScorings || []
          : undefined, // Conditionally attach
      });
    }

    // Prepare evaluation parameters and store them in a map
    for (const param of evaluationParams) {
      evalParamMap.set(param.id, { ...param, subParams: [] }); // subParams will store child evaluation parameters
    }

    // Attach sub-risk factors to their parents
    for (const risk of riskFactors) {
      if (risk.parentId) {
        const parentRisk = riskFactorMap.get(risk.parentId);
        if (parentRisk) {
          parentRisk.subFactors.push(riskFactorMap.get(risk.id));
        }
      } else {
        topLevelRiskFactors.push(riskFactorMap.get(risk.id));
      }
    }

    // Attach sub-evaluation parameters correctly
    for (const param of evaluationParams) {
      if (param.parentId) {
        // Attach as a sub-evaluation parameter under the parent
        const parentParam = evalParamMap.get(param.parentId);
        if (parentParam) {
          parentParam.subParams.push(evalParamMap.get(param.id));
        }
      }
    }

    // Attach evaluation parameters to risk factors & set `isSelected` properly
    for (const param of evaluationParams) {
      if (param.riskFactorId) {
        const relatedRiskFactor = riskFactorMap.get(param.riskFactorId);
        if (relatedRiskFactor) {
          const evaluationParam = evalParamMap.get(param.id);

          if (!evaluationParam) continue; // Ensure it's valid

          if (evaluationParam.subParams.length > 0) {
            // If subParams exist, attach `subParams[]` but keep main param in the list
            relatedRiskFactor.riskEvaluationParameters.push({
              ...evaluationParam,
              subParams: evaluationParam.subParams.map((sub) => ({
                ...sub,
                isSelected: relatedRiskFactor.riskFactorScorings?.some(
                  (scoring) => scoring.selectedEvaluationParamId === sub.id,
                ),
              })),
            });
          } else {
            // If no subParams, set `isSelected` directly in `riskEvaluationParameters`
            relatedRiskFactor.riskEvaluationParameters.push({
              ...evaluationParam,
              isSelected: relatedRiskFactor.riskFactorScorings?.some(
                (scoring) => scoring.selectedEvaluationParamId === param.id,
              ),
            });
          }
        }
      }
    }

    const formatData = (riskFactor) => {
      if (!riskFactor) return null;

      const { createdAt, updatedAt, subParams, ...cleanData } = riskFactor;

      return {
        ...cleanData,
        subFactors:
          Array.isArray(cleanData.subFactors) && cleanData.subFactors.length > 0
            ? cleanData.subFactors.map(formatData)
            : undefined,

        riskEvaluationParameters:
          Array.isArray(cleanData.riskEvaluationParameters) &&
          cleanData.riskEvaluationParameters.length > 0
            ? cleanData.riskEvaluationParameters
                .map(formatData)
                .filter((param) => param && Object.keys(param).length > 0)
            : undefined,

        subParams:
          Array.isArray(subParams) && subParams.length > 0
            ? subParams.map(formatData).filter(Boolean)
            : undefined,

        riskFactorScorings: undefined, // Do not display the riskFactorScorings in response
      };
    };

    return topLevelRiskFactors.map(formatData);
  }

  findOne(id: number) {
    return `This action returns a #${id} riskFactor`;
  }

  update(id: number, updateRiskFactorDto: UpdateRiskFactorDto) {
    return `This action updates a #${id} riskFactor`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskFactor`;
  }
}
