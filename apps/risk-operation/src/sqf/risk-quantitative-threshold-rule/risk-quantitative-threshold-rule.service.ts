import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskQuantitativeThresholdRuleDto } from './dto/create-risk-quantitative-threshold-rule.dto';
import { UpdateRiskQuantitativeThresholdRuleDto } from './dto/update-risk-quantitative-threshold-rule.dto';
import { RiskQuantitativeThresholdRuleRepository } from '../../repositories/risk-quantitative-threshold-rule.repository';
import { RiskProfileRepository } from '../../repositories/risk-profile.repository';
import { DataSource } from 'typeorm';
import { RiskQuantitativeParameterService } from '../risk-quantitative-parameter/risk-quantitative-parameter.service';
import { RiskQuantitativeThresholdRule } from '../../models/risk-quantitative-threshold-rule.entity';
import { RiskQuantitativeProfileWeightService } from '../risk-quantitative-profile-weight/risk-quantitative-profile-weight.service';

@Injectable()
export class RiskQuantitativeThresholdRuleService {
  constructor(
    private readonly riskQuantitativeThresholdRuleRepository: RiskQuantitativeThresholdRuleRepository,
    private readonly riskQuantitativeParameterService: RiskQuantitativeParameterService,
    private readonly riskQuantitativeProfileWeightService: RiskQuantitativeProfileWeightService,
    private readonly riskProfileRepository: RiskProfileRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    riskProfileCode: string,
    createRiskQuantitativeThresholdRuleDto: CreateRiskQuantitativeThresholdRuleDto,
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

    try {
      const { quantitativeParameter, quantitativeSubParameter, rules } =
        createRiskQuantitativeThresholdRuleDto;

      // Get parameter and sub-parameter from injected service
      const parameterData = await this.riskQuantitativeParameterService.findOne(
        quantitativeParameter,
      );

      const subParam = parameterData.data.riskQuantitativeSubParameters.find(
        (sp) => sp.name === quantitativeSubParameter,
      );

      const parameterId = parameterData.data.id;
      const subParamId = subParam.id;

      // Check for existing rules
      const existingRules = await queryRunner.manager.find(
        RiskQuantitativeThresholdRule,
        {
          where: {
            riskProfileId: getRiskProfile.id,
            quantitativeParameterId: parameterId,
            quantitativeSubParameterId: subParamId,
          },
        },
      );

      if (existingRules.length > 0) {
        throw new HttpException(
          {
            message: `Threshold rules already exist for this parameterId: ${parameterId} & subParameterId: ${subParamId}.`,
            statusCode: HttpStatus.CONFLICT,
          },
          HttpStatus.CONFLICT,
        );
      }

      const newThresholdRules = rules.map(
        (rule) =>
          new RiskQuantitativeThresholdRule({
            riskProfileId: getRiskProfile.id,
            quantitativeParameterId: parameterId,
            quantitativeSubParameterId: subParamId,
            score: rule.score,
            thresholdValue: rule.thresholdValue,
            thresholdLabel: rule.thresholdLabel ?? null,
            comparisonOperator: rule.comparisonOperator,
            isManualTriggerAllowed:
              rule.isManualTriggerAllowed === true ? 1 : 0, // convert boolean to 1 / 0
          }),
      );

      const savedRules = await queryRunner.manager.save(newThresholdRules);

      await queryRunner.commitTransaction();

      return {
        message:
          'Risk Quantitative Threshold Rules have been saved successfully.',
        statusCode: HttpStatus.CREATED,
        data: {
          quantitativeParameterId: parameterId,
          quantitativeParameterName: quantitativeParameter,
          quantitativeSubParameterId: subParamId,
          quantitativeSubParameterName: quantitativeSubParameter,
          rules: savedRules.map((r) => ({
            score: r.score,
            thresholdValue: r.thresholdValue,
            thresholdLabel: r.thresholdLabel ?? null,
            comparisonOperator: r.comparisonOperator,
            isManualTriggerAllowed: r.isManualTriggerAllowed === 1,
          })),
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.error('Error storing RiskQuantitativeThresholdRule: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to store RiskQuantitativeThresholdRule`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Release the query runner to free up database resources
      await queryRunner.release();
    }
  }

  async duplicateDefaultThresholdRules(riskProfileCode: string) {
    const targetProfile = await this.riskProfileRepository.findOne({
      where: { riskProfileCode },
    });

    if (!targetProfile) {
      throw new NotFoundException(
        `Risk profile with riskProfileCode: ${riskProfileCode} not found.`,
      );
    }

    // Get default riskProfile
    const defaultProfile = await this.riskProfileRepository.findOne({
      where: { isDefault: 1 },
    });

    if (!defaultProfile) {
      throw new NotFoundException('Default risk profile not found.');
    }

    // Grouped rules from raw SQL
    const groupedRules = await this.dataSource.query(`
      SELECT 
        param.name AS "quantitativeParameter",
        sub.name AS "quantitativeSubParameter",
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'score', rule.score,
            'thresholdValue', rule.threshold_value,
            'thresholdLabel', rule.threshold_label,
            'comparisonOperator', rule.comparison_operator,
            'isManualTriggerAllowed', rule.is_manual_trigger_allowed
          ) ORDER BY rule.score
        ) AS rules
      FROM risk_quantitative_threshold_rule rule
      JOIN risk_profile profile ON profile.id = rule.risk_profile_id
      JOIN risk_quantitative_parameter param ON param.id = rule.quantitative_parameter_id
      JOIN risk_quantitative_sub_parameter sub ON sub.id = rule.quantitative_sub_parameter_id
      WHERE profile.is_default = 1
      GROUP BY param.name, sub.name
      ORDER BY param.name, sub.name;
  `);

    for (const group of groupedRules) {
      const dto: CreateRiskQuantitativeThresholdRuleDto = {
        quantitativeParameter: group.quantitativeParameter,
        quantitativeSubParameter: group.quantitativeSubParameter,
        rules: group.rules.map((r: any) => ({
          score: r.score,
          thresholdValue: r.thresholdValue,
          thresholdLabel: r.thresholdLabel,
          comparisonOperator: r.comparisonOperator,
          isManualTriggerAllowed: r.isManualTriggerAllowed === true,
        })),
      };

      const result = await this.create(riskProfileCode, dto); // reuse create() method
    }

    return {
      message: `Default RiskQuantitativeThresholdRules have been successfully duplicated for riskProfileCode: ${riskProfileCode}.`,
      statusCode: 201,
    };
  }

  async getRulesByProfileAndSubParameter(
    riskProfileId: number,
    quantitativeSubParameterId: number,
  ) {
    try {
      const getThresholdRules =
        await this.riskQuantitativeThresholdRuleRepository.find({
          where: {
            riskProfileId,
            quantitativeSubParameterId,
          },
          order: { score: 'ASC' },
        });

      return getThresholdRules.map((rule) => ({
        ruleId: rule.id,
        score: rule.score,
        thresholdValue: rule.thresholdValue,
        thresholdLabel: rule.thresholdLabel ?? null,
        comparisonOperator: rule.comparisonOperator,
        isManualTriggerAllowed:
          rule.isManualTriggerAllowed === 1 ? true : false,
      }));
    } catch (error) {
      console.error('Error retrieve getRulesByProfileAndSubParameter: ', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve getRulesByProfileAndSubParameter`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll() {
    return `This action returns all riskQuantitativeThresholdRule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} riskQuantitativeThresholdRule`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskQuantitativeThresholdRule`;
  }
}
