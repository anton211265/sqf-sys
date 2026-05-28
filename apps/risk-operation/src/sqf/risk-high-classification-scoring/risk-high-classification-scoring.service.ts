import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskHighClassificationScoringDto } from './dto/create-risk-high-classification-scoring.dto';
import { UpdateRiskHighClassificationScoringDto } from './dto/update-risk-high-classification-scoring.dto';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationScoringRepository } from '../../repositories/risk-application-scoring.repository';
import { RiskHighClassificationFactorRepository } from '../../repositories/risk-high-classification-factor.repository';
import { RiskHighClassificationScoringRepository } from '../../repositories/risk-high-classification-scoring.repository';
import { RiskHighClassificationScoring } from '../../models/risk-high-classification-scoring.entity';
import { DataSource } from 'typeorm';
import { Application } from '../../models/application.entity';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';

@Injectable()
export class RiskHighClassificationScoringService {
  constructor(
    private readonly applicationRepository: ApplicationRepository,
    private readonly riskApplicationScoringRepository: RiskApplicationScoringRepository,
    private readonly riskHighClassificationScoringRepository: RiskHighClassificationScoringRepository,
    private readonly riskHighClassificationFactorRepository: RiskHighClassificationFactorRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(applicationNumber: string, riskFactors: string[]) {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Check if application exists
    const application = await queryRunner.manager.findOne(Application, {
      where: { applicationNumber },
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
        `No risk model found for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      // Get all riskClassificationFactors based on riskModelId
      const getRiskHighClassificationFactor = await queryRunner.manager.find(
        RiskHighClassificationFactor,
        {
          where: { riskModelId: riskApplicationScoring.riskModelId },
        },
      );

      if (!getRiskHighClassificationFactor.length) {
        throw new NotFoundException(
          `No risk classification factors found for applicationNumber: ${applicationNumber}.`,
        );
      }

      if (!riskFactors || riskFactors.length === 0) {
        // Remove all high risk factor scoring if pass in riskFactors from request is an empty array []
        await this.remove(applicationNumber);

        await queryRunner.commitTransaction();

        return {
          message:
            'All risk classification scoring records have been removed successfully.',
          statusCode: HttpStatus.OK,
        };
      }

      // Convert database factors into a Map
      const riskFactorMap = new Map(
        getRiskHighClassificationFactor.map((factor) => [
          factor.riskFactor,
          factor,
        ]),
      );

      // Initialize match counter
      let matchedCount = 0;

      // Delete existing records before insert because we will use this endpoint for edit and store
      await this.remove(applicationNumber);

      // Loop through valid risk factors and save each one
      for (const factor of riskFactors) {
        if (riskFactorMap.has(factor)) {
          const newRiskFactor = new RiskHighClassificationScoring({
            riskApplicationScoring: riskApplicationScoring, // Assign full entity
            riskHighClassificationFactor: riskFactorMap.get(factor), // Assign full entity
            isSelected: 1,
          });

          await queryRunner.manager.save(newRiskFactor); // Save as an entity

          matchedCount++; // Increase match count
        }
      }

      // Do not trigger empty array in requets, bcos FE will allow for [] empty array to be passed

      await queryRunner.commitTransaction();

      return {
        message:
          matchedCount > 0
            ? `Successfully processed ${matchedCount} risk classification scoring record(s).`
            : riskFactors.length === 0
              ? 'All risk classification scoring records have been removed successfully.'
              : 'No matching risk factors found. No new records were created or updated.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Error storing riskHighClassificationScoring: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store riskHighClassificationScoring`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(applicationNumber: string) {
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

    const riskApplicationScoring = application.riskApplicationScoring;

    if (!riskApplicationScoring) {
      throw new NotFoundException(
        `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
      );
    }

    try {
      const riskHighClassificationScorings =
        await this.riskHighClassificationScoringRepository.find({
          where: { riskApplicationScoringId: riskApplicationScoring.id },
          relations: ['riskHighClassificationFactor'],
          order: {
            createdAt: 'ASC',
          },
        });

      return {
        message:
          'riskHighClassificationScoring has been retrieved successfully.',
        statusCode: HttpStatus.OK,
        data: {
          riskApplicationScoringId: riskApplicationScoring.id,
          riskModelId: riskApplicationScoring.riskModelId,
          total: riskHighClassificationScorings.length,
          riskHighClassificationFactors: riskHighClassificationScorings.map(
            (riskFactorScoring) => ({
              riskHighClassificationScoringId: riskFactorScoring.id,
              riskHighClassificationFactorId:
                riskFactorScoring.riskHighClassificationFactor.id,
              factorName:
                riskFactorScoring.riskHighClassificationFactor.riskFactor,
              description:
                riskFactorScoring.riskHighClassificationFactor.description,
              isSelected: riskFactorScoring.isSelected === 1 ? true : false,
            }),
          ),
        },
      };
    } catch (error) {
      console.error('Error fetching riskHighClassificationScoring: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to fetched riskHighClassificationScoring`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    applicationNumber: string,
    updateRiskHighClassificationScoringDto: UpdateRiskHighClassificationScoringDto,
  ) {
    try {
      // Delete existing records
      await this.remove(applicationNumber);

      // Re-insert new risk factors from DTO
      await this.create(
        applicationNumber,
        updateRiskHighClassificationScoringDto.riskFactors,
      );

      return {
        message: 'RiskHighClassificationScoring has been updated successfully.',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error('Error updating riskHighClassificationScoring: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update riskHighClassificationScoring`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async remove(applicationNumber: string) {
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

    try {
      const riskApplicationScoring = application.riskApplicationScoring;

      if (!riskApplicationScoring) {
        throw new NotFoundException(
          `No riskApplicationScoring found for applicationNumber: ${applicationNumber}.`,
        );
      }

      const riskHighClassificationScorings =
        await this.riskHighClassificationScoringRepository.find({
          where: { riskApplicationScoringId: riskApplicationScoring.id },
          relations: ['riskHighClassificationFactor'],
          order: {
            createdAt: 'ASC',
          },
        });

      await this.riskHighClassificationScoringRepository.delete({
        riskApplicationScoring: riskApplicationScoring,
      });
    } catch (error) {
      console.error('Error deleting riskHighClassificationScoring: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to delete riskHighClassificationScoring`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
