import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskQuantitativeProfileWeightDto } from './dto/create-risk-quantitative-profile-weight.dto';
import { UpdateRiskQuantitativeProfileWeightDto } from './dto/update-risk-quantitative-profile-weight.dto';
import { RiskQuantitativeProfileWeightRepository } from '../../repositories/risk-quantitative-profile-weight.repository';
import { RiskQuantitativeProfileWeight } from '../../models/risk-quantitative-profile-weight.entity';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { DataSource, IsNull } from 'typeorm';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { UpdateRiskQuantitativeParameterWeightDto } from './dto/update-risk-quantitative-parameter-weight.dto';
import { UpdateRiskQuantitativeSubParameterWeightDto } from './dto/update-risk-quantitative-sub-parameter-weight.dto';

@Injectable()
export class RiskQuantitativeProfileWeightService {
  constructor(
    private readonly riskQuantitativeProfileWeightRepository: RiskQuantitativeProfileWeightRepository,
    private readonly riskProfileRepository: RiskProfileRepository,
    private readonly riskQuantitativeParameterService: RiskQuantitativeParameterService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    riskProfileCode: string,
    createRiskQuantitativeProfileWeightDto: CreateRiskQuantitativeProfileWeightDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

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

    const parameters = await this.riskQuantitativeParameterService.findAll();

    const weights = [];

    try {
      for (const weightDto of createRiskQuantitativeProfileWeightDto.weights) {
        const param = parameters.find(
          (p) => p.name === weightDto.parameterName,
        );

        // Throw error if param not found
        if (!param) {
          throw new NotFoundException(
            `Parameter with name: ${weightDto.parameterName} not found.`,
          );
        }

        let subParamId: number | null = null;

        if (weightDto.subParameterName) {
          const sub = param.riskQuantitativeSubParameters.find(
            (s) => s.name === weightDto.subParameterName,
          );

          // Throw error if sub param not found
          if (!sub) {
            throw new NotFoundException(
              `Sub-parameter with name: ${weightDto.subParameterName} not found.`,
            );
          }
          subParamId = sub.id;
        }

        const weightParam = new RiskQuantitativeProfileWeight({
          riskProfileId: getRiskProfile.id,
          quantitativeParameterId: param.id,
          quantitativeSubParameterId: subParamId,
          weight: weightDto.weight,
        });

        const savedWeight = await queryRunner.manager.save(weightParam);

        weights.push(savedWeight);
      }

      await queryRunner.commitTransaction();

      return {
        message:
          'Risk quantitative profile weights have been saved successfully.',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Error storing riskQuantitativeProfileWeight: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store riskQuantitativeProfileWeight`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  async duplicateDefaultRiskProfileWeights(riskProfileCode: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const targetProfile = await this.riskProfileRepository.findOne({
        where: { riskProfileCode },
      });

      if (!targetProfile) {
        throw new NotFoundException(
          `Risk profile with riskProfileCode: ${riskProfileCode} not found.`,
        );
      }

      // Get default riskProfile
      const defaultRiskProfile = await this.riskProfileRepository.findOne({
        where: { isDefault: 1 },
      });

      if (!defaultRiskProfile) {
        throw new NotFoundException('Default risk profile not found.');
      }

      // Get the RiskQuantitativeProfileWeight for default riskProfile
      const defaultRiskQuantitativeProfileWeights =
        await this.riskQuantitativeProfileWeightRepository.find({
          where: { riskProfileId: defaultRiskProfile.id },
        });

      const savedWeights = [];

      // Create entity for RiskQuantitativeProfileWeight
      for (const w of defaultRiskQuantitativeProfileWeights) {
        const weight = new RiskQuantitativeProfileWeight({
          riskProfileId: targetProfile.id,
          quantitativeParameterId: w.quantitativeParameterId,
          quantitativeSubParameterId: w.quantitativeSubParameterId,
          weight: w.weight,
        });

        const saved = await queryRunner.manager.save(weight);

        savedWeights.push(saved);
      }

      await queryRunner.commitTransaction();

      return {
        message: `Default RiskQuantitativeProfileWeight have been successfully duplicated for riskProfileCode: ${riskProfileCode}.`,
        statusCode: 201,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Error duplicate RiskQuantitativeProfileWeight: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to duplicate RiskQuantitativeProfileWeight`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  async findAll(riskProfileCode: string) {
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

      const getRiskQuantitativeProfileWeight =
        await this.riskQuantitativeProfileWeightRepository.find({
          where: { riskProfileId: getRiskProfile.id },
        });

      const groupedRiskQuantitativeProfileWeight =
        getRiskQuantitativeProfileWeight
          .filter((w) => w.quantitativeSubParameterId === null) // only parent weights
          .map((parent) => {
            const subWeights = getRiskQuantitativeProfileWeight.filter(
              (w) =>
                w.quantitativeParameterId === parent.quantitativeParameterId &&
                w.quantitativeSubParameterId !== null,
            );

            return {
              parameterId: parent.quantitativeParameter.id,
              parameterName: parent.quantitativeParameter.name,
              weight: Number(parent.weight),
              subParameters:
                parent.quantitativeParameter.riskQuantitativeSubParameters.map(
                  (sub) => {
                    const matched = subWeights.find(
                      (w) => w.quantitativeSubParameterId === sub.id,
                    );
                    return {
                      subParameterId: sub.id,
                      subParameterName: sub.name,
                      weight: matched ? Number(matched.weight) : null,
                    };
                  },
                ),
            };
          });

      return {
        message: `Risk quantitative profile weights with riskProfileCode: ${riskProfileCode} have been retrieved successfully.`,
        statusCode: HttpStatus.OK,
        data: groupedRiskQuantitativeProfileWeight,
      };
    } catch (error) {
      console.error(
        `Error retrieving riskQuantitativeProfileWeights with riskProfileCode: ${riskProfileCode}. `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskQuantitativeProfileWeights with riskProfileCode: ${riskProfileCode}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(riskProfileCode: string, quantitativeParameterName: string) {
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
      const { data: getQuantitativeParameter } =
        await this.riskQuantitativeParameterService.findOne(
          quantitativeParameterName,
        );

      const getParameterandSubParameterWeights =
        await this.riskQuantitativeProfileWeightRepository
          .createQueryBuilder('weight')
          .leftJoinAndSelect('weight.quantitativeParameter', 'param')
          .leftJoinAndSelect('weight.quantitativeSubParameter', 'sub')
          .where('weight.riskProfileId = :riskProfileId', {
            riskProfileId: getRiskProfile.id,
          })
          .andWhere(
            'weight.quantitativeParameterId = :quantitativeParameterId',
            {
              quantitativeParameterId: getQuantitativeParameter.id,
            },
          )
          .getMany();

      // Get parent parameter
      const parameter = getParameterandSubParameterWeights.find(
        (w) => !w.quantitativeSubParameterId,
      );

      const formattedParameterData = {
        id: parameter?.id ?? null,
        parameterId: getQuantitativeParameter.id,
        parameterName: getQuantitativeParameter.name,
        weight: parameter?.weight ?? 0,
        subParameters: getParameterandSubParameterWeights
          .filter((w) => w.quantitativeSubParameter)
          .map((w) => ({
            id: w.id,
            subParameterId: w.quantitativeSubParameter.id,
            subParameterName: w.quantitativeSubParameter.name,
            weight: w.weight,
          })),
      };

      return {
        statusCode: HttpStatus.OK,
        message: `Risk Quantitative Profile Weight for ${quantitativeParameterName} retrieved successfully.`,
        data: formattedParameterData,
      };
    } catch (error) {
      console.error(
        `Error retrieve riskQuantitativeParameterWeight for ${quantitativeParameterName}:`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve riskQuantitativeParameterWeight for ${quantitativeParameterName}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(
    riskProfileId: number,
    quantitativeParameterId: number,
    quantitativeSubParameterId: number | null = null,
    weight: number,
  ) {
    let getParameterWeight;

    if (quantitativeSubParameterId === null) {
      getParameterWeight =
        await this.riskQuantitativeProfileWeightRepository.findOne({
          where: {
            riskProfileId,
            quantitativeParameterId,
            quantitativeSubParameterId: IsNull(),
          },
        });
    } else {
      getParameterWeight =
        await this.riskQuantitativeProfileWeightRepository.findOne({
          where: {
            riskProfileId,
            quantitativeParameterId,
            quantitativeSubParameterId,
          },
        });
    }

    if (!getParameterWeight) {
      throw new NotFoundException(
        `Weight record not found for parameterId: ${quantitativeParameterId}, subParameterId: ${quantitativeSubParameterId}`,
      );
    }

    getParameterWeight.weight = weight;

    return await this.riskQuantitativeProfileWeightRepository.save(
      getParameterWeight,
    );
  }

  remove(id: number) {
    return `This action removes a #${id} riskQuantitativeProfileWeight`;
  }
}
