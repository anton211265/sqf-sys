import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { RiskProfile } from '../../models/risk-profile.entity';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { DataSource } from 'typeorm';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';
import { RiskQuantitativeThresholdRuleService } from '../risk-quantitative-threshold-rule/risk-quantitative-threshold-rule.service';
import { UpdateParameterWeightAndManualTriggerFlagDto } from './dto/update-parameter-weight-and-manual-trigger-flag.dto';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';

@Injectable()
export class RiskProfileService {
  constructor(
    private readonly riskProfileRepository: RiskProfileRepository,
    private readonly riskQuantitativeProfileWeightRepository: RiskQuantitativeProfileWeightRepository,
    private readonly riskQuantitativeProfileWeightService: RiskQuantitativeProfileWeightService,
    private readonly riskQuantitativeThresholdRuleService: RiskQuantitativeThresholdRuleService,
    private readonly riskQuantitativeThresholdRuleRepository: RiskQuantitativeThresholdRuleRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRiskProfileDto: CreateRiskProfileDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sectorCode =
        createRiskProfileDto.businessSector === 'OTHERS'
          ? `OTHERS-${createRiskProfileDto.businessSectorOther
              ?.toUpperCase()
              .replace(/\s+/g, '')}`
          : createRiskProfileDto.businessSector;

      const capitalSize = createRiskProfileDto.capitalSize;

      // Generate riskProfileCode
      const riskProfileCode =
        `${sectorCode}-${createRiskProfileDto.capitalCurrency}-${capitalSize}`.toUpperCase();

      // Check if riskProfileCode already exists
      const existingRiskProfile = await this.riskProfileRepository.findOne({
        where: { riskProfileCode },
      });

      if (existingRiskProfile) {
        throw new ConflictException(
          `Risk profile with riskProfileCode: ${riskProfileCode} already exists.`,
        );
      }

      // Create new riskProfile entity
      const newRiskProfile = new RiskProfile({
        riskProfileCode: riskProfileCode,
        businessSector: createRiskProfileDto.businessSector,
        businessSectorOther: createRiskProfileDto.businessSectorOther ?? null,
        capitalSize: createRiskProfileDto.capitalSize,
        capitalCurrency: createRiskProfileDto.capitalCurrency,
        isDefault: 0,
        numberOfActiveProfiles: 0,
        lowRiskThresholds: [0, 30],
        mediumRiskThresholds: [31, 70],
        highRiskThresholds: [71, 100],
      });

      const createdRiskProfile = await queryRunner.manager.save(newRiskProfile);

      await queryRunner.commitTransaction();

      // Duplicate default riskQuantitativeProfileWeight
      const duplicatedDefaultRiskProfileWeights =
        await this.riskQuantitativeProfileWeightService.duplicateDefaultRiskProfileWeights(
          riskProfileCode,
        );

      // Duplicate default riskQuantitativeThresholdRule
      const duplicatedDefaultThresholdRules =
        await this.riskQuantitativeThresholdRuleService.duplicateDefaultThresholdRules(
          riskProfileCode,
        );

      return {
        message: 'New Risk Profile has been created.',
        statusCode: HttpStatus.CREATED,
        data: createdRiskProfile,
      };
    } catch (error) {
      console.error(`Error creating risk profile: `, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to create risk profile.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  async findAll() {
    try {
      // Get list of risk profiles
      const riskProfileList = await this.riskProfileRepository.find({
        select: [
          'id',
          'riskProfileCode',
          'businessSector',
          'businessSectorOther',
          'capitalSize',
          'capitalCurrency',
          'numberOfActiveProfiles',
        ],
      });

      return {
        statusCode: 200,
        message: 'Risk profiles retrieved successfully.',
        data: riskProfileList.map((riskProfileData) => ({
          ...riskProfileData,
          businessSector:
            riskProfileData.businessSector === 'OTHERS'
              ? riskProfileData.businessSectorOther
              : riskProfileData.businessSector,
        })),
      };
    } catch (error) {
      console.error(`Error retrieving risk profiles: `, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve risk profiles.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(riskProfileCode: string) {
    try {
      // Check if risk profile exists
      const getRiskProfile = await this.riskProfileRepository.findOne({
        where: { riskProfileCode },
      });

      if (!getRiskProfile) {
        throw new HttpException(
          {
            message: `Risk Profile with riskProfileCode: ${riskProfileCode} not found.`,
            statusCode: HttpStatus.BAD_REQUEST,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Get formatted response of params, subparams and weights from riskQuantitativeProfileWeightService
      const riskQuantitativeProfileWeights =
        await this.riskQuantitativeProfileWeightService.findAll(
          riskProfileCode,
        );

      // Get only the parameters (no sub-parameters)
      const riskQuantitativeParametersOnly =
        riskQuantitativeProfileWeights.data.map((p) => ({
          parameterId: p.parameterId,
          parameterName: p.parameterName,
        }));

      return {
        statusCode: 200,
        message: `Risk Profile with riskProfileCode: ${riskProfileCode} retrieved successfully.`,
        data: {
          id: getRiskProfile.id,
          riskProfileCode: getRiskProfile.riskProfileCode,
          businessSector: getRiskProfile.businessSector,
          businessSectorOther: getRiskProfile.businessSectorOther,
          capitalSize: getRiskProfile.capitalSize,
          capitalCurrency: getRiskProfile.capitalCurrency,
          riskQuantitativeParameters: riskQuantitativeParametersOnly,
        },
      };
    } catch (error) {
      console.error(
        `Error retrieving risk profile with riskProfileCode: ${riskProfileCode}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve risk profile with riskProfileCode: ${riskProfileCode}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRiskProfileParametersByName(
    riskProfileCode: string,
    riskQuantitativeParameterName: string,
  ) {
    // Check if risk profile exists
    const getRiskProfile = await this.riskProfileRepository.findOne({
      where: { riskProfileCode },
    });

    if (!getRiskProfile) {
      throw new HttpException(
        {
          message: `Risk Profile with riskProfileCode: ${riskProfileCode} not found.`,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const getParametersWithWeights =
        await this.riskQuantitativeProfileWeightService.findAll(
          riskProfileCode,
        );

      const filteredParameter = getParametersWithWeights.data.find(
        (p) => p.parameterName === riskQuantitativeParameterName,
      );

      if (!filteredParameter) {
        throw new NotFoundException(
          `Risk Quantitative Parameter with riskQuantitativeParameterName: ${riskQuantitativeParameterName} not found.`,
        );
      }

      // Prepare an array to store sub-parameters with their associated rules
      const formattedSubParams = [];

      for (const sub of filteredParameter.subParameters) {
        // Retrieve threshold rules for the current sub-parameter
        const rules =
          await this.riskQuantitativeThresholdRuleService.getRulesByProfileAndSubParameter(
            getRiskProfile.id,
            sub.subParameterId,
          );

        // Append sub-parameter with its threshold rules into the array
        formattedSubParams.push({
          ...sub,
          rules, // each rule includes score, thresholdValue, label, comparison, and manual trigger flag
        });
      }

      return {
        statusCode: 200,
        message: `Risk Quantitative Parameter with riskQuantitativeParameterName: ${riskQuantitativeParameterName} retrieved successfully.`,
        data: {
          parameterId: filteredParameter.parameterId,
          parameterName: filteredParameter.parameterName,
          weight: filteredParameter.weight,
          subParameters: formattedSubParams,
        },
      };
    } catch (error) {
      console.error('Error retrieve riskQuantitativeParameter: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskQuantitativeParameter`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    riskProfileCode: string,
    updateRiskProfileDto: UpdateRiskProfileDto,
  ) {
    // Check if riskProfile exists
    const getRiskProfile = await this.riskProfileRepository.findOne({
      where: { riskProfileCode },
    });

    if (!getRiskProfile) {
      throw new HttpException(
        {
          message: `Risk Profile with riskProfileCode: ${riskProfileCode} not found.`,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const sectorCode =
        updateRiskProfileDto.businessSector === 'OTHERS'
          ? `OTHERS-${updateRiskProfileDto.businessSectorOther
              ?.toUpperCase()
              .replace(/\s+/g, '')}`
          : updateRiskProfileDto.businessSector;

      const capitalSize = updateRiskProfileDto.capitalSize;
      const capitalCurrency = updateRiskProfileDto.capitalCurrency;

      // Generate riskProfileCode
      const newRiskProfileCode =
        `${sectorCode}-${capitalCurrency}-${capitalSize}`.toUpperCase();

      // Check if new riskProfileCode already exists (and it's not the same one we're updating)
      if (newRiskProfileCode === riskProfileCode) {
        throw new BadRequestException(
          `New riskProfileCode: ${newRiskProfileCode} is identical to the existing one. No changes were made.`,
        );
      }

      // Check if new riskProfileCode already exists in other record
      const existingRiskProfile = await this.riskProfileRepository.findOne({
        where: { riskProfileCode: newRiskProfileCode },
      });

      if (existingRiskProfile) {
        throw new ConflictException(
          `Risk profile with riskProfileCode: ${newRiskProfileCode} already exists.`,
        );
      }

      // Update values
      getRiskProfile.riskProfileCode = newRiskProfileCode;
      getRiskProfile.businessSector = updateRiskProfileDto.businessSector;
      getRiskProfile.businessSectorOther =
        updateRiskProfileDto.businessSectorOther ?? null;
      getRiskProfile.capitalSize = capitalSize;
      getRiskProfile.capitalCurrency = capitalCurrency;

      await this.riskProfileRepository.save(getRiskProfile);

      return {
        message: `Risk Profile with riskProfileCode: ${riskProfileCode} has been updated to new riskProfileCode: ${newRiskProfileCode}.`,
        statusCode: HttpStatus.OK,
        data: getRiskProfile,
      };
    } catch (error) {
      console.error(
        `Error updating risk profile with riskProfileCode: ${riskProfileCode}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update risk profile with riskProfileCode: ${riskProfileCode}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateParametersWeightandManualTriggerFlags(
    riskProfileCode: string,
    updateParameterWeightAndManualTriggerFlagDto: UpdateParameterWeightAndManualTriggerFlagDto,
  ) {
    const { parameterName, weight, subParameters } =
      updateParameterWeightAndManualTriggerFlagDto;

    // Check if riskProfile exists
    const getRiskProfile = await this.riskProfileRepository.findOne({
      where: { riskProfileCode },
    });

    if (!getRiskProfile) {
      throw new HttpException(
        {
          message: `Risk Profile with riskProfileCode: ${riskProfileCode} not found.`,
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Get parameter and sub-param info
      const { data: parameterData } =
        await this.riskQuantitativeProfileWeightService.findOne(
          riskProfileCode,
          parameterName,
        );

      const parameterId = parameterData.parameterId;

      console.log({
        profileId: getRiskProfile.id,
        parameterId,
        weight,
      });

      // update parent parameter weight
      await this.riskQuantitativeProfileWeightService.update(
        getRiskProfile.id,
        parameterId,
        null, // null means updating parent parameter
        weight,
      );

      const updatedSubParameters = [];

      for (const subParameter of subParameters) {
        const matchingSubParameter = parameterData.subParameters.find(
          (sp) => sp.subParameterName === subParameter.subParameterName,
        );

        if (!matchingSubParameter) {
          throw new NotFoundException(
            `Sub-parameter '${subParameter.subParameterName}' not found under '${parameterName}'.`,
          );
        }

        const subParameterId = matchingSubParameter.subParameterId;

        // update sub-parameter weight
        await this.riskQuantitativeProfileWeightService.update(
          getRiskProfile.id,
          parameterId,
          subParameterId,
          subParameter.weight,
        );

        // Retrieve the current rules for the given parameter and sub-parameter
        const getThresholdRules =
          await this.riskQuantitativeThresholdRuleRepository.find({
            where: {
              riskProfileId: getRiskProfile.id,
              quantitativeParameterId: parameterId,
              quantitativeSubParameterId: subParameterId,
            },
          });

        // Update the isManualTriggerAllowed flag based on the scoreRules array from request
        for (const rule of subParameter.rules) {
          const match = getThresholdRules.find((r) => r.score === rule.score);

          if (match) {
            match.isManualTriggerAllowed =
              rule.isManualTriggerAllowed === true ? 1 : 0;

            await this.riskQuantitativeThresholdRuleRepository.save(match);
          }
        }

        const updatedThresholdRules =
          await this.riskQuantitativeThresholdRuleRepository.find({
            where: {
              riskProfileId: getRiskProfile.id,
              quantitativeParameterId: parameterId,
              quantitativeSubParameterId: subParameterId,
            },
            order: {
              quantitativeSubParameterId: 'ASC',
              score: 'ASC',
            },
          });

        console.log(updatedThresholdRules);

        updatedSubParameters.push({
          subParameterId: subParameterId,
          subParameterName: subParameter.subParameterName,
          weight: subParameter.weight,
          rules: updatedThresholdRules.map((r) => ({
            score: r.score,
            thresholdValue: r.thresholdValue,
            thresholdLabel: r.thresholdLabel,
            comparisonOperator: r.comparisonOperator,
            isManualTriggerAllowed:
              r.isManualTriggerAllowed === 1 ? true : false,
          })),
        });
      }

      return {
        message: `Parameter and sub-parameter weights and manual trigger flags for parameterName: ${parameterName} and riskProfileCode: ${riskProfileCode} have been updated successfully.`,
        statusCode: 200,
        data: {
          parameterId: parameterId,
          parameterName,
          weight,
          subParameters: updatedSubParameters,
        },
      };
    } catch (error) {
      console.error(
        `Error updating parameter and manual trigger flags for parameterName: ${parameterName} and riskProfileCode: ${riskProfileCode}: `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to update parameter and manual trigger flags for parameterName: ${parameterName} and riskProfileCode: ${riskProfileCode}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  remove(id: number) {
    return `This action removes a #${id} riskProfile`;
  }
}
