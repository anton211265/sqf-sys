import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskModelDto } from './dto/create-risk-model.dto';
import { UpdateRiskModelDto } from './dto/update-risk-model.dto';
import { RiskModel } from '../../models/risk-model.entity';
import { RiskModelStatusEnum } from '@app/common/apps/risk-operation/enums/risk-model-status.enum';
import { RiskModelRepository } from '../../repositories/risk-model.repository';
import { UpdateRiskThresholdDto } from './dto/update-risk-thresholds.dto';
import { omit } from 'lodash';
import { RiskFactorService } from '../risk-factor/risk-factor.service';
import { GetRiskModelsDto } from './dto/get-all-risk-model.dto';

@Injectable()
export class RiskModelService {
  constructor(
    private readonly riskModelRepository: RiskModelRepository,
    private readonly riskFactorService: RiskFactorService,
  ) {}

  async create(createRiskModelDto: CreateRiskModelDto) {
    // Check for existing risk model
    const existingRiskModel = await this.riskModelRepository.findOne({
      where: { riskModelName: createRiskModelDto.riskModelName },
    });

    if (existingRiskModel) {
      throw new HttpException(
        {
          message: 'Risk Model Name already exists.',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const latestRiskModel = await this.riskModelRepository
      .createQueryBuilder('entity')
      .orderBy('entity.id', 'DESC')
      .getOne();

    const nextModelId = latestRiskModel
      ? `RM-${(parseInt(latestRiskModel.riskModelNumber.split('-')[1]) + 1)
          .toString()
          .padStart(5, '0')}`
      : 'RM-00001';

    const newRiskModel = new RiskModel({
      riskModelNumber: nextModelId.toString(),
      riskModelName: createRiskModelDto.riskModelName,
      description: createRiskModelDto.description,
      numberOfActiveProfiles: 0,
      riskModelStatus: RiskModelStatusEnum.DRAFT,
      lowRiskThresholds: [0, 30], // Default numrange
      mediumRiskThresholds: [31, 70], // Default numrange
      highRiskThresholds: [71, 100], // Default numrange
    });

    const createdRiskModel = await this.riskModelRepository.save(newRiskModel);

    return {
      message: 'New Risk Model has been created.',
      statusCode: HttpStatus.CREATED,
      data: createdRiskModel,
    };
  }

  async findAll(getRiskModelsDto: GetRiskModelsDto) {
    try {
      const whereCondition = getRiskModelsDto.riskModelStatus
        ? { riskModelStatus: getRiskModelsDto.riskModelStatus }
        : {};

      const riskModelList = await this.riskModelRepository.find({
        select: [
          'id',
          'riskModelNumber',
          'riskModelName',
          'description',
          'riskModelStatus',
          'numberOfActiveProfiles',
        ],

        where: whereCondition,
        order: { createdAt: 'DESC' },
      });

      return {
        statusCode: 200,
        message: 'Risk models retrieved successfully.',
        data: riskModelList,
      };
    } catch (error) {
      console.error(`Error retrieving risk models: `, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve risk models.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(riskModelNumber: string) {
    try {
      const getRiskModel = await this.riskModelRepository.findOne({
        where: {
          riskModelNumber: riskModelNumber,
        },
        relations: {
          riskHighClassificationFactors: true,
        },
      });

      // Throw error if Risk Model not found
      if (!getRiskModel) {
        throw new NotFoundException(
          `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
        );
      }

      // Get risk factors
      const riskFactorsResponse = await this.riskFactorService.findAll(
        getRiskModel.riskModelNumber,
        { includeRiskFactorScoring: false },
      );

      // Extract only `data` from response
      const riskFactors = riskFactorsResponse.data ?? []; // Default to empty array if undefined

      const formattedRiskHighClassificationFactors =
        getRiskModel.riskHighClassificationFactors.map(
          ({ id, riskFactor, description }) => ({
            id,
            riskFactor,
            description,
          }),
        );

      return {
        statusCode: 200,
        message: `Risk model for riskModelNumber: ${riskModelNumber} retrieved successfully.`,
        data: {
          id: getRiskModel.id,
          riskModelNumber: getRiskModel.riskModelNumber,
          riskModelName: getRiskModel.riskModelName,
          riskModelStatus: getRiskModel.riskModelStatus,
          description: getRiskModel.description,
          numberOfActiveProfiles: getRiskModel.numberOfActiveProfiles,
          lowRiskThresholds: getRiskModel.lowRiskThresholds,
          mediumRiskThresholds: getRiskModel.mediumRiskThresholds,
          highRiskThresholds: getRiskModel.highRiskThresholds,
          riskHighClassificationFactors: formattedRiskHighClassificationFactors,
          riskFactors: riskFactors,
        },
      };
    } catch (error) {
      console.error(
        `Error retrieving risk model for riskModelNumber: ${riskModelNumber}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve risk model for riskModelNumber: ${riskModelNumber}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    riskModelNumber: string,
    updateRiskModelDto: UpdateRiskModelDto,
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
      // Only update provided fields
      if (updateRiskModelDto.riskModelName !== undefined) {
        getRiskModel.riskModelName = updateRiskModelDto.riskModelName;
      }

      if (updateRiskModelDto.description !== undefined) {
        getRiskModel.description = updateRiskModelDto.description;
      }

      await this.riskModelRepository.save(getRiskModel);

      return {
        message: 'Risk model updated successfully',
        statusCode: 200,
        data: {
          id: getRiskModel.id,
          riskModelNumber: getRiskModel.riskModelNumber,
          riskModelName: getRiskModel.riskModelName,
          description: getRiskModel.description,
          riskModelStatus: getRiskModel.riskModelStatus,
          numberOfActiveProfiles: getRiskModel.numberOfActiveProfiles,
          lowRiskThresholds: getRiskModel.lowRiskThresholds,
          mediumRiskThresholds: getRiskModel.mediumRiskThresholds,
          highRiskThresholds: getRiskModel.highRiskThresholds,
        },
      };
    } catch (error) {
      console.error(
        `Error updating risk model for riskModelNumber: ${riskModelNumber}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update risk model for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(riskModelNumber: string) {
    const riskModel = await this.riskModelRepository.findOne({
      where: { riskModelNumber },
    });

    if (!riskModel) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber ${riskModelNumber} not found.`,
      );
    }

    try {
      if (riskModel.riskModelStatus !== 'DRAFT') {
        throw new BadRequestException(
          `Risk Model with riskModelNumber ${riskModelNumber} cannot be deleted. Status must be 'DRAFT' to delete.`,
        );
      }

      await this.riskModelRepository.delete({ riskModelNumber });

      return {
        statusCode: HttpStatus.OK,
        message: 'Risk Model has been removed successfully.',
      };
    } catch (error) {
      console.error(
        `Error remove risk model for riskModelNumber: ${riskModelNumber}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to remove risk model for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateRiskModelStatus(
    riskModelNumber: string,
    status: RiskModelStatusEnum,
  ) {
    const riskModelData = await this.riskModelRepository.findOne({
      where: {
        riskModelNumber: riskModelNumber,
      },
    });

    // Throw error if Risk Model not found
    if (!riskModelData) {
      throw new NotFoundException(
        `Risk Model with riskModelNumber: ${riskModelNumber} not found.`,
      );
    }

    try {
      riskModelData.riskModelStatus = status;

      await this.riskModelRepository.save(riskModelData);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Risk Model Status had been updated.',
      };
    } catch (error) {
      console.error(
        `Error updating status for riskModelNumber: ${riskModelNumber}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update status for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateThresholds(
    riskModelNumber: string,
    updateRiskThresholdDto: UpdateRiskThresholdDto,
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
      getRiskModel.lowRiskThresholds = [
        updateRiskThresholdDto.minLow,
        updateRiskThresholdDto.maxLow,
      ] as [number, number];
      getRiskModel.mediumRiskThresholds = [
        updateRiskThresholdDto.minMedium,
        updateRiskThresholdDto.maxMedium,
      ] as [number, number];
      getRiskModel.highRiskThresholds = [
        updateRiskThresholdDto.minHigh,
        updateRiskThresholdDto.maxHigh,
      ] as [number, number];

      await this.riskModelRepository.save(getRiskModel);

      return {
        message: `Risk thresholds for riskModelNumber: ${riskModelNumber} updated successfully`,
        statusCode: 200,
        data: {
          id: getRiskModel.id,
          riskModelName: getRiskModel.riskModelName,
          riskModelNumber: getRiskModel.riskModelNumber,
          lowRiskThresholds: getRiskModel.lowRiskThresholds,
          mediumRiskThresholds: getRiskModel.mediumRiskThresholds,
          highRiskThresholds: getRiskModel.highRiskThresholds,
        },
      };
    } catch (error) {
      console.error(
        `Error updating risk thresholds for riskModelNumber: ${riskModelNumber}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update risk thresholds for riskModelNumber: ${riskModelNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
