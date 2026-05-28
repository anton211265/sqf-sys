import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskApplicationScoringDto } from './dto/create-risk-application-scoring.dto';
import { UpdateRiskApplicationScoringDto } from './dto/update-risk-application-scoring.dto';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { AssignRiskModelToApplicationScoringDto } from './dto/assign-risk-model-to-application-scoring.dto';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { RiskFactorScoring } from '../../models/risk-factor-scoring.entity';
import { RiskFactorScoringRepository } from '../../repositories/risk-factor-scoring.repository';
import { RiskModel } from '../../models/risk-model.entity';
import { DataSource, In, IsNull } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { RiskFactorRepository } from '../../repositories/risk-factor.repository';
import { SubmitApplicationForSettlementDto } from './dto/submit-application-for-settlement.dto';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { changeRiskProfileToApplicationScoringDto } from './dto/change-risk-profile-to-application-scoring.dto';
import { UpdateRiskFilter1StatusDto } from './dto/update-risk-filter-1-status.dto';
import { RiskManualReviewAlertRepository } from '../../repositories/risk-manual-review-alert.repository';
import { RiskApplicationAuditLogService } from '../risk-application-audit-log/risk-application-audit-log.service';
import { RiskApplicationAuditActionEnum } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';
import { ApplicationStatusEnum } from '@app/common/apps/risk-operation/enums/application-status.enum';

@Injectable()
export class RiskApplicationScoringService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly riskApplicationScoringRepository: RiskApplicationScoringRepository,
    private readonly riskModelRepository: RiskModelRepository,
    private readonly riskFactorService: RiskFactorService,
    private readonly riskFactorScoringRepository: RiskFactorScoringRepository,
    private readonly riskFactorRepository: RiskFactorRepository,
    private readonly riskProfileRepository: RiskProfileRepository,
    private readonly riskManualReviewAlertRepository: RiskManualReviewAlertRepository,
    private readonly riskApplicationAuditLogService: RiskApplicationAuditLogService,
    @InjectDataSource() private readonly dataSource: DataSource, // Inject DataSource
  ) {}

  async assignRiskModel(
    applicationNumber: string,
    assignRiskModelToApplicationScoringDto: AssignRiskModelToApplicationScoringDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Find the application
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Find risk application scoring for the application
    const getRiskApplicationScoring =
      await this.riskApplicationScoringRepository.findOne({
        where: { applicationId: getApplication.id },
        select: ['id', 'riskModelId'],
      });

    if (!getRiskApplicationScoring) {
      throw new NotFoundException(
        `No risk application scoring record found for applicationNumber: ${applicationNumber}.`,
      );
    }

    // Ensure riskModel is NOT already assigned
    if (getRiskApplicationScoring.riskModelId) {
      throw new BadRequestException(
        `Application with applicationNumber: ${applicationNumber} is already linked to a risk model.`,
      );
    }

    // Validate if the risk model exists
    const getRiskModel = await this.riskModelRepository.findOne({
      where: {
        riskModelNumber: assignRiskModelToApplicationScoringDto.riskModelNumber,
      },
    });

    if (!getRiskModel) {
      throw new NotFoundException(
        `No risk model found with riskModelNumber: ${assignRiskModelToApplicationScoringDto.riskModelNumber}.`,
      );
    }

    // Ensure the risk model is in PUBLISHED status
    if (getRiskModel.riskModelStatus !== RiskModelStatusEnum.PUBLISHED) {
      throw new BadRequestException(
        `The risk model with riskModelNumber: ${assignRiskModelToApplicationScoringDto.riskModelNumber} is not currently in 'PUBLISHED' status.`,
      );
    }

    try {
      // Assign new risk model to the riskApplicationScoring and save
      getRiskApplicationScoring.riskModel = getRiskModel;

      await this.riskApplicationScoringRepository.save(
        getRiskApplicationScoring,
      );

      // Increase 1 to number of active profiles
      getRiskModel.numberOfActiveProfiles =
        getRiskModel.numberOfActiveProfiles + 1;

      await this.riskModelRepository.save(getRiskModel);

      // Read all risk factors in risk model from risk factor service
      const riskFactorResponse = await this.riskFactorService.findAll(
        getRiskModel.riskModelNumber,
        { includeRiskFactorScoring: false },
      );

      const riskFactors = riskFactorResponse.data;

      const processFactor = async (factor, parentScoringId = null) => {
        if (!factor) return null; // Skip null factors early

        // Create and save new factor scoring entry
        const savedNewFactorScoring =
          await this.riskFactorScoringRepository.save(
            new RiskFactorScoring({
              riskApplicationScoringId: getRiskApplicationScoring.id,
              riskFactorId: factor.id,
              parentId: parentScoringId,
              riskFactorName: factor.riskFactorName,
              isAQuestion: factor.isRequireEvaluationParameter === true ? 1 : 0,
              weight: factor.weight,
              scoreRangeMin: factor.scoreRangeMin,
              scoreRangeMax: factor.scoreRangeMax,
            }),
          );

        // Get only valid subFactors (remove null values)
        const subFactors = factor.subFactors
          ? factor.subFactors.filter((f) => f !== null)
          : [];

        const subFactorResults = [];

        for (const subFactor of subFactors) {
          const result = await processFactor(
            subFactor,
            savedNewFactorScoring.id,
          );

          subFactorResults.push(result);
        }

        return {
          riskFactorScoringId: savedNewFactorScoring.id,
          riskFactorId: savedNewFactorScoring.riskFactorId,
          riskApplicationScoringId:
            savedNewFactorScoring.riskApplicationScoringId,
          parentId: savedNewFactorScoring.parentId,
          riskFactorName: savedNewFactorScoring.riskFactorName,
          weight: savedNewFactorScoring.weight,
          isAQuestion: savedNewFactorScoring.isAQuestion,
          minScore: factor.scoreRangeMin,
          maxScore: factor.scoreRangeMax,
          ...(subFactorResults.length > 0 && { subFactors: subFactorResults }),
        };
      };

      const processedFactors = [];

      for (const factor of riskFactors) {
        processedFactors.push(await processFactor(factor));
      }

      const calculateQuestionsAndMaxScore = (
        factor,
        parentId = null,
        parentScores = new Map(),
      ) => {
        if (!factor) return parentScores; // Always return a Map

        let totalQuestions = 0;
        let maxScoreSum = 0;
        let questionParentId = parentId; // Track the common parent ID

        // If this factor is a question, process it
        if (factor.isAQuestion === 1) {
          let factorParentId = factor.parentId ?? factor.id; // Use its own ID if no parentId (1-level factor)

          if (!questionParentId) {
            questionParentId = factorParentId; // Set the first encountered parentId
          }

          totalQuestions += 1;
          maxScoreSum += factor.maxScore || 0;

          // Store results per parent factor
          if (!parentScores.has(questionParentId)) {
            parentScores.set(questionParentId, {
              totalQuestions: 0,
              maxScoreSum: 0,
            });
          }

          let existing = parentScores.get(questionParentId);
          existing.totalQuestions += 1;
          existing.maxScoreSum += factor.maxScore || 0;
          parentScores.set(questionParentId, existing);
        }

        // Process sub-factors recursively
        const subFactors = factor.subFactors?.filter(Boolean) || [];
        for (const subFactor of subFactors) {
          parentScores = calculateQuestionsAndMaxScore(
            subFactor,
            questionParentId,
            parentScores,
          );
        }

        return parentScores; // Always return a Map
      };

      // Store calculations separately per parent factor
      let parentFactorScores = new Map();

      for (const factor of processedFactors) {
        parentFactorScores = calculateQuestionsAndMaxScore(
          factor,
          null,
          parentFactorScores,
        ); // No more type errors
      }

      // Query and update scores per parent factor
      for (const [parentId, scores] of parentFactorScores.entries()) {
        if (!parentId) continue; // Ignore null parent IDs

        const parentRiskScoring =
          await this.riskFactorScoringRepository.findOne({
            where: { id: parentId },
          });

        if (parentRiskScoring) {
          parentRiskScoring.scoreRangeMin = scores.totalQuestions;
          parentRiskScoring.scoreRangeMax = scores.maxScoreSum;
          await this.riskFactorScoringRepository.save(parentRiskScoring);
        }
      }

      // Debugging: Check the final parent scores in logs
      console.log(
        'Updated Parent Factor Scores:',
        Object.fromEntries(parentFactorScores),
      );

      // Example
      // Updated Parent Factor Scores: {
      // '2': { totalQuestions: 2, maxScoreSum: 15 },
      // '5': { totalQuestions: 2, maxScoreSum: 20 }
      // }

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        message: `RiskModelNumber: '${getRiskModel.riskModelNumber}' has been successfully assigned to applicationNumber: '${applicationNumber}'.`,
        statusCode: HttpStatus.OK,
        data: {
          applicationId: getApplication.id,
          applicationNumber: applicationNumber,
          riskModelId: getRiskModel ? getRiskModel.id : null,
          riskModelNumber: getRiskModel ? getRiskModel.riskModelNumber : null,
          riskScoringFactors: processedFactors,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error(
        `Error to assign risk model for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to assign risk model for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async changeRiskProfile(
    applicationNumber: string,
    changeRiskProfileToApplicationScoringDto: changeRiskProfileToApplicationScoringDto,
  ) {
    // Find the application
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Find risk application scoring for the application
    const getRiskApplicationScoring =
      await this.riskApplicationScoringRepository.findOne({
        where: { applicationId: getApplication.id },
      });

    if (!getRiskApplicationScoring) {
      throw new NotFoundException(
        `No risk application scoring record found for applicationNumber: ${applicationNumber}.`,
      );
    }

    // Check if old risk profile exists
    const getOldRiskProfile = await this.riskProfileRepository.findOne({
      where: {
        id: getRiskApplicationScoring.riskProfileId,
      },
    });

    if (!getOldRiskProfile) {
      throw new NotFoundException(
        `No risk profile assign for applicationNumber: ${applicationNumber}.`,
      );
    }

    getOldRiskProfile.numberOfActiveProfiles =
      getOldRiskProfile.numberOfActiveProfiles - 1;
    await this.riskProfileRepository.save(getOldRiskProfile);

    // Check if risk profile exists
    const getRiskProfile = await this.riskProfileRepository.findOne({
      where: {
        riskProfileCode:
          changeRiskProfileToApplicationScoringDto.riskProfileCode,
      },
    });

    if (!getRiskProfile) {
      throw new HttpException(
        {
          message: `Risk Profile with riskProfileCode: ${changeRiskProfileToApplicationScoringDto.riskProfileCode} not found.`,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Assign new risk model to the riskApplicationScoring and save
    getRiskApplicationScoring.riskProfile = getRiskProfile;

    await this.riskApplicationScoringRepository.save(getRiskApplicationScoring);

    // Increase 1 to number of active profiles
    getRiskProfile.numberOfActiveProfiles =
      getRiskProfile.numberOfActiveProfiles + 1;

    await this.riskProfileRepository.save(getRiskProfile);

    return {
      message: `RiskProfileCode: '${changeRiskProfileToApplicationScoringDto.riskProfileCode}' has been successfully assigned to applicationNumber: '${applicationNumber}'.`,
      statusCode: HttpStatus.OK,
    };
  }

  async findOne(applicationNumber: string) {
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    try {
      const getRiskApplicationScoring =
        await this.riskApplicationScoringRepository.findOne({
          where: { applicationId: getApplication.id },
        });

      if (!getRiskApplicationScoring) {
        throw new NotFoundException(
          `No risk application scoring record found for applicationNumber: ${applicationNumber}.`,
        );
      }

      let getRiskProfile: RiskProfile | null = null;

      if (getRiskApplicationScoring.riskProfileId) {
        getRiskProfile = await this.riskProfileRepository.findOne({
          where: {
            id: getRiskApplicationScoring.riskProfileId,
          },
        });
      }

      let getRiskModel: RiskModel | null = null;

      if (getRiskApplicationScoring.riskModelId) {
        getRiskModel = await this.riskModelRepository.findOne({
          where: {
            id: getRiskApplicationScoring.riskModelId,
          },
        });
      }

      return {
        message: `riskApplicationScoring for applicationNumber: ${applicationNumber} retrieved successfully.`,
        statusCode: HttpStatus.OK,
        data: {
          applicationId: getApplication.id,
          applicationNumber: applicationNumber,

          // Risk Filter 1
          riskFilter1: {
            riskProfileId: getRiskProfile?.id ?? null,
            riskProfileCode: getRiskProfile?.riskProfileCode ?? null,
            totalScoreRiskFilter1:
              getRiskApplicationScoring.riskFilter1TotalScore,
            riskFilter1Category: getRiskApplicationScoring.riskFilter1Category,
            riskFilter1Status: getRiskApplicationScoring.riskFilter1Status,
            riskFilter1LastUpdatedAt:
              getRiskApplicationScoring.riskFilter1UpdatedAt,
          },

          // Risk Filter 2
          riskModelId: getRiskModel ? getRiskModel.id : null,
          riskModelNumber: getRiskModel ? getRiskModel.riskModelNumber : null,
          riskCategory: getRiskApplicationScoring.riskFilter2Category,

          totalScoreRiskFilter2:
            getRiskApplicationScoring.riskFilter2TotalScore,
          isRiskSurveyCompleted:
            getRiskApplicationScoring.isRiskSurveyCompleted === null
              ? null
              : getRiskApplicationScoring.isRiskSurveyCompleted === 1,
          isSubmittedForSettlement:
            getRiskApplicationScoring.isSubmittedForSettlement === null
              ? null
              : getRiskApplicationScoring.isSubmittedForSettlement === 1,
          isAuthorizationRequired:
            getRiskApplicationScoring.isAuthorizationRequired === null
              ? null
              : getRiskApplicationScoring.isAuthorizationRequired === 1,
          lastUpdatedAt: getRiskApplicationScoring.riskFilter2UpdatedAt,
        },
      };
    } catch (error) {
      console.error(
        `Error fetching riskApplicationScoring for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskApplicationScoring for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async submitApplicationForSettlement(
    applicationNumber: string,
    submitApplicationForSettlementDto: SubmitApplicationForSettlementDto,
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
      const getRiskApplicationScoring =
        await this.riskApplicationScoringRepository.findOne({
          where: { id: riskApplicationScoring.id },
        });

      if (!getRiskApplicationScoring) {
        throw new NotFoundException(
          `No risk application scoring record found for applicationNumber: ${applicationNumber}.`,
        );
      }

      if (getRiskApplicationScoring.isRiskSurveyCompleted !== 1) {
        throw new BadRequestException(
          `Cannot submit for settlement. The risk scoring survey is incomplete (isRiskSurveyCompleted: false).`,
        );
      }

      getRiskApplicationScoring.isAuthorizationRequired =
        submitApplicationForSettlementDto.isAuthorizationRequired === true
          ? 1
          : 0;
      getRiskApplicationScoring.isSubmittedForSettlement = 1;

      await this.riskApplicationScoringRepository.save(
        getRiskApplicationScoring,
      );

      return {
        message:
          'Application with ${applicationNumber} has been submiited for settlememt successfully.',
        statusCode: HttpStatus.OK,
        data: {
          applicationNumber: applicationNumber,
          riskApplicationScoringId: riskApplicationScoring.id,
          isRiskSurveyCompleted:
            getRiskApplicationScoring.isRiskSurveyCompleted === 1
              ? true
              : false,
          isSubmittedForSettlement:
            getRiskApplicationScoring.isSubmittedForSettlement === 1
              ? true
              : false,
          isAuthorizationRequired:
            getRiskApplicationScoring.isAuthorizationRequired === 1
              ? true
              : false,
        },
      };
    } catch (error) {
      console.error(
        `Error to submit for settlement for applicationNumber: ${applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error to submit for settlement for applicationNumber: ${applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  update(
    id: number,
    updateRiskApplicationScoringDto: UpdateRiskApplicationScoringDto,
  ) {
    return `This action updates a #${id} riskApplicationScoring`;
  }

  async updateRiskFilter1Status(
    applicationNumber: string,
    updateRiskFilter1StatusDto: UpdateRiskFilter1StatusDto,
  ) {
    const { status, updatedBy } = updateRiskFilter1StatusDto;

    // Get application entity
    const getApplication = await this.applicationRepository.findOne({
      where: { applicationNumber: applicationNumber },
      relations: [
        'riskApplicationScoring',
        'riskApplicationScoring.riskProfile',
      ],
    });

    if (!getApplication) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = getApplication.riskApplicationScoring;

    try {
      riskApplicationScoring.riskFilter1Status = status;
      await this.riskApplicationScoringRepository.save(riskApplicationScoring);

      const getUnresolvedManualReviewAlerts =
        await this.riskManualReviewAlertRepository.find({
          where: {
            riskApplicationScoringId: riskApplicationScoring.id,
            isResolved: 0, // Get all unresolved alerts
          },
        });

      // Resolved all manual review alerts
      for (const alert of getUnresolvedManualReviewAlerts) {
        alert.isResolved = 1;
        alert.isResolvedAt = new Date();
        alert.isResolvedBy = updatedBy;

        await this.riskManualReviewAlertRepository.save(alert);
      }

      // Add in new entry in audit trail
      await this.riskApplicationAuditLogService.create({
        applicationNumber,
        performedBy: updatedBy,
        actionType:
          status === 'APPROVED'
            ? RiskApplicationAuditActionEnum.MANUAL_REVIEW_APPROVED
            : RiskApplicationAuditActionEnum.MANUAL_REVIEW_REJECTED,
      });

      // Change application status to PENDING_RISK_FILTER_2
      await this.applicationRepository.update(
        { id: getApplication.id },
        { applicationStatus: ApplicationStatusEnum.PENDING_RISK_FILTER_2 },
      );

      return {
        message: `Risk Filter 1 Status has been set to ${status} and unresolved alerts are marked as resolved.`,
        statusCode: 200,
      };
    } catch (error) {
      console.error(
        `Error updating riskFilter1Status and resolve manual review alerts for applicationNumber: ${applicationNumber}`,
        error,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update riskFilter1Status and resolve manual review alerts for applicationNumber: ${applicationNumber}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
