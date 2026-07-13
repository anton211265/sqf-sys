import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssignScoreToRiskFactorScoringDto } from './dto/assign-score-to-risk-factor-scoring.dto';
import { UpdateRiskFactorScoringDto } from './dto/update-risk-factor-scoring.dto';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { RiskFactorScoring } from '../../models/risk-factor-scoring.entity';
import { RiskFactorScoringRepository } from '../../repositories/risk-factor-scoring.repository';
import { DataSource, In, IsNull } from 'typeorm';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskCategoryEnum } from '@app/common/apps/risk-operation/enums/risk-category.enum';
import { RiskHighClassificationScoringService } from '../risk-high-classification-scoring/risk-high-classification-scoring.service';

@Injectable()
export class RiskFactorScoringService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly riskModelRepository: RiskModelRepository,
    private readonly riskFactorScoringRepository: RiskFactorScoringRepository,
    private readonly riskHighClassificationScoringService: RiskHighClassificationScoringService,
    private readonly dataSource: DataSource,
    private readonly riskApplicationScoringRepository: RiskApplicationScoringRepository,
  ) {}

  async storeRiskScores(
    applicationNumber,
    assignScoreToRiskFactorScoringDto: AssignScoreToRiskFactorScoringDto,
  ) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: { applicationNumber },
      select: ['id'],
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    if (riskApplicationScoring.riskModelId === null) {
      throw new NotFoundException(
        `riskModelId not found in riskApplicationScoring for applicationNumber: ${applicationNumber}.`,
      );
    }

    const getRiskModel = await this.riskModelRepository.findOne({
      where: {
        riskModelNumber: assignScoreToRiskFactorScoringDto.riskModelNumber,
      },
    });

    if (!getRiskModel) {
      throw new NotFoundException(
        `No risk model found for riskModelId: ${riskApplicationScoring.riskModelId}.`,
      );
    }

    if (riskApplicationScoring.riskModelId !== getRiskModel.id) {
      throw new NotFoundException(
        `Risk model mismatch: Expected riskModelId ${getRiskModel.id}, but found ${riskApplicationScoring.riskModelId}. Please ensure the correct risk model is used.`,
      );
    }

    // Get the top level factor id (main factor)
    const topLevelFactorId =
      assignScoreToRiskFactorScoringDto.riskScoringSurveyData?.riskFactorId;

    // Extract valid question factors with scores
    const filteredQuestionFactors = this.getFilteredRiskFactorScoringList(
      assignScoreToRiskFactorScoringDto.riskScoringSurveyData,
    );

    if (!filteredQuestionFactors.length) {
      throw new NotFoundException(
        'No valid question factors with scores found.',
      );
    }

    // Fetch matching riskFactorScoring records in a single query
    const riskFactorIds = filteredQuestionFactors.map((q) => q.riskFactorId);

    const riskFactorScoringRecords =
      await this.riskFactorScoringRepository.find({
        where: { riskFactorId: In(riskFactorIds) },
      });

    if (!riskFactorScoringRecords.length) {
      throw new NotFoundException(
        'No matching risk factor scoring records found.',
      );
    }

    // Find the match riskFactorScoring based in riskFactorId
    // Store score and selectedEvaluationParamId
    for (const record of riskFactorScoringRecords) {
      const updatedFactor = filteredQuestionFactors.find(
        (q) => q.riskFactorId === record.riskFactorId,
      );

      if (updatedFactor) {
        record.score = updatedFactor.score;
        record.selectedEvaluationParamId =
          updatedFactor.selectedEvaluationParamId;
        record.selectedCountry = updatedFactor.selectedCountry ?? null;

        await this.riskFactorScoringRepository.save(record);
      }
    }

    const result = await this.calculateRiskScoresAndWeight(
      riskApplicationScoring.id,
      riskFactorIds,
      topLevelFactorId,
    );

    return {
      message: `Risk factor scoring for ${riskFactorScoringRecords.length} factor(s) for riskApplicationScoring: ${riskApplicationScoring.id} has been successfully updated.`,
      statusCode: HttpStatus.OK,
      applicationNumber,
      riskModelNumber: assignScoreToRiskFactorScoringDto.riskModelNumber,
      data: result,
    };
  }

  private getFilteredRiskFactorScoringList(
    factor: any,
    result: any[] = [], // Simple array to store questions
  ): any[] {
    if (!factor) return result;

    // If this is a question with a score, store it
    if (
      !factor.isSetAsCategory &&
      factor.isRequireEvaluationParameter &&
      factor.score !== null
    ) {
      result.push({
        riskFactorId: factor.riskFactorId,
        selectedEvaluationParamId: factor.selectedEvaluationParamId,
        selectedCountry: factor.selectedCountry,
        riskFactorName: factor.riskFactorName,
        score: factor.score,
      });
    }

    // Recursively process sub-factors
    if (factor.subFactors?.length) {
      for (const subFactor of factor.subFactors) {
        this.getFilteredRiskFactorScoringList(subFactor, result);
      }
    }

    return result;
  }

  private async calculateRiskScoresAndWeight(
    riskApplicationScoringId: number,
    questionFactorIds: number[],
    topLevelFactorId: number,
  ) {
    // Get the question factors, group by parentId
    // Get the sum of totalSubFactorScore
    // query result will display:
    //    parentId
    //    totalSubFactorScore,
    //    factors:
    // [
    //   {
    //     "id": 6,
    //     "parentId": 5,
    //     "riskFactorId": 3,
    //     "riskFactorName": "LEGAL & REGULATORY FRAMEWORK STABILITY",
    //     "score": 4
    //   },
    //   {
    //     "id": 7,
    //     "parentId": 5,
    //     "riskFactorId": 4,
    //     "riskFactorName": "CONSISTENCY OF ENFORCEMENT",
    //     "score": 9
    //   }
    // ]
    const questionFactors = await this.dataSource.query(
      `
      SELECT 
        "parentId",
        SUM("score") AS "totalSubFactorScore",
        json_agg(json_build_object(
          'id', "id",
          'riskFactorId', "riskFactorId",
          'parentId', "parentId",
          'riskFactorName', "riskFactorName",
          'score', "score"
        )) AS "factors"
      FROM "risk_factor_scoring"
      WHERE "isAQuestion" = 1
      AND "riskApplicationScoringId" = $1
      AND "riskFactorId" IN (${questionFactorIds.join(
        ',',
      )}) -- Use riskFactorIds (question factor from request) in query
      GROUP BY "parentId"
    `,
      [riskApplicationScoringId],
    );

    if (!questionFactors.length) {
      throw new NotFoundException('No question factors found.');
    }

    // Get parent factors of the question factors based on parentId.
    // Uses parameterised placeholders ($1, $2, ...) to prevent SQL injection.
    const parentIds = questionFactors.map((f) => f.parentId);
    const placeholders = parentIds.map((_, i) => `$${i + 1}`).join(',');
    const parentFactors = await this.dataSource.query(
      `SELECT "id", "weight", "riskFactorName", "riskFactorId",
              "scoreRangeMin" AS "minScore", "scoreRangeMax" AS "maxScore"
       FROM "risk_factor_scoring"
       WHERE "id" IN (${placeholders})`,
      parentIds,
    );

    // Update the parent factors
    const updatedParents = questionFactors.map((factor) => {
      const parent = parentFactors.find((p) => p.id === factor.parentId);
      if (!parent)
        throw new NotFoundException(
          `Parent factor ${factor.parentId} not found.`,
        );

      // Calculate factorScore
      const rawFactorScore =
        parent.maxScore !== parent.minScore
          ? (factor.totalSubFactorScore - parent.minScore) /
            (parent.maxScore - parent.minScore)
          : 0;

      // Now multiply by 100 to get the percentage
      const factorScore = rawFactorScore * 100;

      // Calculate weightedFactorScore
      const rawWeightedFactorScore = factorScore * parent.weight;

      // Final weighted score
      const weightedFactorScore = rawWeightedFactorScore / 100;

      return {
        id: factor.parentId,
        totalSubFactorScore: factor.totalSubFactorScore,
        factorScoreRawValue: rawFactorScore, // Raw value before convert into percentage
        factorScore: Math.round(factorScore * 100) / 100, // As percentage
        weight: parent.weight,
        weightedFactorScoreRawValue: rawWeightedFactorScore, // Raw value before convert into percentage
        weightedFactorScore: Math.round(weightedFactorScore * 100) / 100, // As percentage
      };
    });

    // Batch update for parent factors
    await this.riskFactorScoringRepository.save(updatedParents);

    // Get top-level factor where parentId = null
    const topLevelFactor = await this.dataSource.query(
      `
      SELECT "id", "weight", "riskFactorName", "riskFactorId", "parentId"
      FROM "risk_factor_scoring"
      WHERE "parentId" IS NULL 
      AND "riskApplicationScoringId" = $1
      AND "riskFactorId" = $2
    `,
      [riskApplicationScoringId, topLevelFactorId],
    );

    if (!topLevelFactor.length) {
      throw new NotFoundException('No top-level risk factor found.');
    }

    const { id, weight, riskFactorName, riskFactorId, parentId } =
      topLevelFactor[0];

    let topLevelWeightedFactorScore = null;

    // For FH, if parentId of question factor is null (means parent factor of question factor is the top level factor), no need to calculate the topLevelFactor since parent row of question factor will be top level factor
    // For Synlian, has 3 layer (top level, parent of question factor, question factor), so need to calculate the top level factor
    // Check if topLevelFactor exists in updatedParentsQuestionFactors
    const isTopLevelFactorAQuestionFactor = updatedParents.some(
      (factor) => factor.id === topLevelFactor[0]?.id,
    );

    if (!isTopLevelFactorAQuestionFactor) {
      const totalWeightedFactorScore = updatedParents.reduce(
        (sum, f) => sum + f.weightedFactorScore,
        0,
      );

      topLevelWeightedFactorScore = (weight * totalWeightedFactorScore) / 100;

      await this.dataSource.query(
        `
      UPDATE "risk_factor_scoring"
      SET "weightedFactorScore" = $2
      WHERE "id" = $1
    `,
        [id, Math.round(topLevelWeightedFactorScore * 100) / 100],
      );
    }

    return {
      id: Number(id),
      riskFactorId: riskFactorId,
      riskFactorName: riskFactorName,
      weight: Number(weight),
      weightedFactorScore: Math.round(topLevelWeightedFactorScore * 100) / 100,
      subFactors: questionFactors.map((factor) => {
        const parentFactor = parentFactors.find(
          (p) => p.id === factor.parentId,
        );

        return {
          id: Number(factor.parentId), // parentId will be the id of the subfactor of question factor
          riskFactorId: parentFactor ? Number(parentFactor.riskFactorId) : null, // Get riskFactorId from parentFactors
          riskFactorName: parentFactor ? parentFactor.riskFactorName : null,
          totalSubFactorScore: Number(factor.totalSubFactorScore),
          weight: parentFactor ? Number(parentFactor.weight) : 0,
          factors:
            typeof factor.factors === 'string'
              ? JSON.parse(factor.factors) // Parse only if it's a string
              : factor.factors, // Use directly if already an object
        };
      }),
    };
  }

  async getRiskFactorScores(
    applicationNumber: string,
    includeRiskParameterGrading = false,
  ) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: { applicationNumber },
      select: ['id'],
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    if (riskApplicationScoring.riskModelId === null) {
      throw new NotFoundException(
        `riskModelId not found in riskApplicationScoring for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      if (!includeRiskParameterGrading) {
        // Get the top level factor in riskFactorScoring that hv no parentId only
        // For pie-chart display
        const getRiskFactorScoring =
          await this.riskFactorScoringRepository.find({
            where: {
              parentId: IsNull(),
              riskApplicationScoringId: riskApplicationScoring.id,
            },
            relations: ['riskFactor'],
          });

        if (!getRiskFactorScoring.length) {
          throw new NotFoundException(
            'No top-level risk factors found for scoring. Please ensure risk factors are configured correctly.',
          );
        }

        const response = getRiskFactorScoring.map((factor) => ({
          riskFactorScoringId: factor.id,
          riskFactorId: factor.riskFactor?.id || null,
          riskFactorName: factor.riskFactor?.riskFactorName || 'Unknown',
          weight: factor.weight ?? null,
          score: factor.weightedFactorScore ?? null,
        }));

        return {
          message: 'Scores for top-level risk factors retrieved successfully.',
          statusCode: HttpStatus.OK,
          totalFactors: response.length,
          data: response,
        };
      } else {
        const allRiskFactorScoring =
          await this.riskFactorScoringRepository.find({
            where: {
              riskApplicationScoringId: riskApplicationScoring.id,
            },
            relations: ['riskFactor', 'parentFactor'],
          });

        if (!allRiskFactorScoring.length) {
          throw new NotFoundException(
            'No risk factors found for scoring. Please ensure risk factors are configured correctly.',
          );
        }

        const buildHierarchy = (factors, parentId = null) => {
          return factors
            .filter((f) => f.parentId === parentId && f.isAQuestion !== 1) // Exclude the factor questions
            .map((factor) => {
              const subFactors = buildHierarchy(factors, factor.id);

              return {
                riskFactorScoringId: factor.id,
                riskFactorId: factor.riskFactor?.id || null,
                riskFactorName: factor.riskFactor?.riskFactorName,
                weight: factor.weight ?? null,
                score: factor.weightedFactorScore ?? null,
                ...(subFactors.length > 0 && { subFactors }),
              };
            });
        };

        const hierarchicalResponse = buildHierarchy(allRiskFactorScoring);

        if (!hierarchicalResponse.length) {
          throw new NotFoundException(
            'No hierarchical data found. Ensure factors have valid parentId relationships.',
          );
        }

        return {
          message:
            'All risk factor scores (structured by parentId) retrieved successfully.',
          statusCode: HttpStatus.OK,
          totalFactors: hierarchicalResponse.length,
          data: hierarchicalResponse,
        };
      }
    } catch (error) {
      console.error(
        `Error to fetch scores for top-level risk factors for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error to fetch top-level risk factors for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRiskFactorSurveyProgress(applicationNumber: string) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: { applicationNumber },
      select: ['id'],
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    if (riskApplicationScoring.riskModelId === null) {
      throw new NotFoundException(
        `riskModelId not found in riskApplicationScoring for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      const topLevelFactors = await this.riskFactorScoringRepository.find({
        where: {
          parentId: IsNull(), // Get only top-level factors
          riskApplicationScoringId: riskApplicationScoring.id,
        },
        relations: ['riskFactor'],
      });

      if (!topLevelFactors.length) {
        throw new NotFoundException(
          'No top-level risk factors found for scoring. Please ensure risk factors are configured correctly.',
        );
      }

      const totalFactors = topLevelFactors.length;

      const doneFactors = topLevelFactors.filter(
        (factor) => factor.weightedFactorScore !== null,
      ).length;

      const completionPercentage =
        totalFactors > 0 ? (doneFactors / totalFactors) * 100 : 0;

      return {
        message:
          'Risk survey progress for top-level risk factors retrieved successfully.',
        statusCode: HttpStatus.OK,
        data: {
          applicationNumber: applicationNumber,
          riskApplicationScoringId: riskApplicationScoring.id,
          riskModelId: riskApplicationScoring.riskModelId,
          totalFactors: totalFactors,
          completedFactors: doneFactors,
          progressCompletionPercentage: Number(completionPercentage.toFixed(2)),
        },
      };
    } catch (error) {
      console.error(
        `Error to fetch risk survey progress for top-level risk factors for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error to fetch risk survey progress for top-level risk factors for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async completeRiskSurvey(applicationNumber: string) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: { applicationNumber },
      select: ['id'],
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    if (riskApplicationScoring.riskModelId === null) {
      throw new NotFoundException(
        `riskModelId not found in riskApplicationScoring for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      const getRiskModel = await this.riskModelRepository.findOne({
        where: {
          id: riskApplicationScoring.riskModelId,
        },
      });

      if (!getRiskModel) {
        throw new NotFoundException(
          `No risk model found for riskModelId: ${riskApplicationScoring.riskModelId}.`,
        );
      }

      const topLevelFactors = await this.riskFactorScoringRepository.find({
        where: {
          parentId: IsNull(), // Get only top-level factors
          riskApplicationScoringId: riskApplicationScoring.id,
        },
        relations: ['riskFactor'],
      });

      if (!topLevelFactors.length) {
        throw new NotFoundException(
          'No top-level risk factors found for scoring. Please ensure risk factors are configured correctly.',
        );
      }

      const incompleteFactors = topLevelFactors.filter(
        (factor) => factor.weightedFactorScore === null,
      );

      if (incompleteFactors.length > 0) {
        throw new BadRequestException(
          `Cannot complete risk scoring survey. ${incompleteFactors.length} top-level factors are incomplete.`,
        );
      }

      const totalWeightedFactorScoreResult = await this.dataSource.query(
        `
        SELECT SUM("weightedFactorScore") AS "totalWeightedFactorScore"
        FROM "risk_factor_scoring"
        WHERE "parentId" IS NULL
        AND "riskApplicationScoringId" = $1
      `,
        [riskApplicationScoring.id],
      );

      let totalWeightedFactorScore = null;

      totalWeightedFactorScore = Number(
        totalWeightedFactorScoreResult[0]?.totalWeightedFactorScore || 0,
      );

      // Get riskHighClassificationScoring
      const getHighRiskClassificationFactorScoring =
        await this.riskHighClassificationScoringService.findAll(
          applicationNumber,
        );

      // If riskHighClassificationFactors[] contains items, set the final score to high (100)
      if (
        getHighRiskClassificationFactorScoring?.data
          .riskHighClassificationFactors.length > 0
      ) {
        totalWeightedFactorScore = 100;
      }

      // Extract risk thresholds directly
      const lowRange: [number, number] = getRiskModel.lowRiskThresholds;
      const mediumRange: [number, number] = getRiskModel.mediumRiskThresholds;
      const highRange: [number, number] = getRiskModel.highRiskThresholds;

      if (!lowRange || !mediumRange || !highRange) {
        throw new BadRequestException('Invalid risk threshold format.');
      }

      // Risk category comparison
      let riskCategory = null;

      if (
        totalWeightedFactorScore >= lowRange[0] &&
        totalWeightedFactorScore <= lowRange[1]
      ) {
        riskCategory = RiskCategoryEnum.LOW;
      } else if (
        totalWeightedFactorScore >= mediumRange[0] &&
        totalWeightedFactorScore <= mediumRange[1]
      ) {
        riskCategory = RiskCategoryEnum.MEDIUM;
      } else if (
        totalWeightedFactorScore >= highRange[0] &&
        totalWeightedFactorScore <= highRange[1]
      ) {
        riskCategory = RiskCategoryEnum.HIGH;
      }

      // Store calculated values
      riskApplicationScoring.riskFilter2TotalScore = totalWeightedFactorScore;
      riskApplicationScoring.riskFilter2Category = riskCategory;
      riskApplicationScoring.isRiskSurveyCompleted = 1;

      await this.riskApplicationScoringRepository.save(riskApplicationScoring);

      return {
        message: `Risk scoring survey for applicationNumber ${applicationNumber} has been completed successfully.`,
        statusCode: HttpStatus.OK,
        data: {
          riskModelId: getRiskModel.id,
          riskModelNumber: getRiskModel.riskModelNumber,
          totalScoreRiskFilter2: totalWeightedFactorScore,
          riskCategory,
          isRiskSurveyCompleted: riskApplicationScoring.isRiskSurveyCompleted,
        },
      };
    } catch (error) {
      console.error(
        `Error completing risk scoring survey for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error completing risk scoring survey for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
