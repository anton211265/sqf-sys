import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskHighClassificationFactorDto } from './dto/create-risk-high-classification-factor.dto';
import { UpdateRiskHighClassificationFactorDto } from './dto/update-risk-high-classification-factor.dto';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { DataSource } from 'typeorm';
import { RiskHighClassificationFactor } from '../../models/risk-high-classification-factor.entity';
import { plainToInstance } from 'class-transformer';
import { RiskHighClassificationFactorRepository } from '../../repositories/risk-high-classification-factor.repository';

@Injectable()
export class RiskHighClassificationFactorService {
  constructor(
    private readonly riskModelRepository: RiskModelRepository,
    private readonly riskHighClassificationFactorRepository: RiskHighClassificationFactorRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    riskModelNumber: string,
    createRiskHighClassificationFactorDto: CreateRiskHighClassificationFactorDto[],
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction(); // Start Transaction

    const getRiskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber: riskModelNumber },
    });

    // Throw error if Risk Model not found
    if (!getRiskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
      );
    }

    try {
      const savedRiskFactors = [];

      for (const highRiskFactorDto of createRiskHighClassificationFactorDto) {
        const newHighRiskClassificationFactor =
          new RiskHighClassificationFactor({
            riskModelId: getRiskModel.id,
            riskFactor: highRiskFactorDto.riskFactor,
            description: highRiskFactorDto.description || null,
          });

        const createdFactor = await queryRunner.manager.save(
          newHighRiskClassificationFactor,
        );

        savedRiskFactors.push(createdFactor);
      }

      await queryRunner.commitTransaction();

      return {
        message:
          'New High Risk Classification Factor has been created successfully.',
        statusCode: HttpStatus.CREATED,
        data: savedRiskFactors.map(({ id, riskFactor, description }) => ({
          id,
          riskFactor: riskFactor,
          description,
        })),
      };
    } catch (error) {
      // If any operation fails, rollback the transaction to prevent partial inserts
      await queryRunner.rollbackTransaction();

      console.error('Error storing riskHighClassificationFactor: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store riskHighClassificationFactor`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  async findAll(riskModelNumber: string) {
    const getRiskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber: riskModelNumber },
    });

    // Throw error if Risk Model not found
    if (!getRiskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
      );
    }

    try {
      const getHighRiskClassificationFactors =
        await this.riskHighClassificationFactorRepository.find({
          select: ['id', 'riskModelId', 'riskFactor', 'description'],
          where: { riskModelId: getRiskModel.id },
          order: {
            createdAt: 'DESC',
          },
        });

      return {
        message: `High Risk Classification Factors for riskModelNumber: ${riskModelNumber} retrieved successfully.`,
        statusCode: HttpStatus.OK,
        data: getHighRiskClassificationFactors,
      };
    } catch (error) {
      console.error('Error fetching riskHighClassificationFactors:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskHighClassificationFactor for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} riskHighClassificationFactor`;
  }

  async update(
    riskModelNumber: string,
    id: number,
    updateRiskHighClassificationFactorDto: UpdateRiskHighClassificationFactorDto,
  ) {
    const getRiskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber: riskModelNumber },
    });

    // Throw error if Risk Model not found
    if (!getRiskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
      );
    }

    try {
      const getHighRiskClassificationFactor =
        await this.riskHighClassificationFactorRepository.findOne({
          where: { id: id },
        });

      if (!getHighRiskClassificationFactor) {
        throw new NotFoundException(
          `Risk High Classification Factor with id: ${id} not found.`,
        );
      }

      Object.assign(
        getHighRiskClassificationFactor,
        updateRiskHighClassificationFactorDto,
      );

      // Save the updated risk factor
      await this.riskHighClassificationFactorRepository.save(
        getHighRiskClassificationFactor,
      );

      return {
        statusCode: 200,
        message: 'Risk factor updated successfully.',
        data: {
          id: getHighRiskClassificationFactor.id,
          riskFactor: getHighRiskClassificationFactor.riskFactor,
          description: getHighRiskClassificationFactor.description,
        },
      };
    } catch (error) {
      console.error(
        `Error updating riskHighClassificationFactors for id: ${id}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update riskHighClassificationFactor for id: ${id} and riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(riskModelNumber: string, id: number) {
    const riskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber },
    });

    if (!riskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber ${riskModelNumber} not found.`,
      );
    }

    try {
      const getHighRiskClassificationFactor =
        await this.riskHighClassificationFactorRepository.findOne({
          where: { id: id },
        });

      if (!getHighRiskClassificationFactor) {
        throw new NotFoundException(
          `Risk High Classification Factor with id: ${id} not found.`,
        );
      }

      await this.riskHighClassificationFactorRepository.delete({ id });

      return {
        statusCode: HttpStatus.OK,
        message:
          'Risk High Classification Factor has been removed successfully.',
      };
    } catch (error) {
      console.error(
        `Error deleting riskHighClassificationFactors for id: ${id}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to delete riskHighClassificationFactor for id: ${id} and riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
