import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRiskQuantitativeParameterDto } from './dto/create-risk-quantitative-parameter.dto';
import { UpdateRiskQuantitativeParameterDto } from './dto/update-risk-quantitative-parameter.dto';
import { RiskQuantitativeParameterRepository } from '../../repositories/risk-quantitative-parameter.repository';

@Injectable()
export class RiskQuantitativeParameterService {
  constructor(
    private readonly riskQuantitativeParameterRepository: RiskQuantitativeParameterRepository,
  ) {}

  create(
    createRiskQuantitativeParameterDto: CreateRiskQuantitativeParameterDto,
  ) {
    return 'This action adds a new riskQuantitativeParameter';
  }

  async findAll() {
    return this.riskQuantitativeParameterRepository
      .createQueryBuilder('param')
      .leftJoinAndSelect('param.riskQuantitativeSubParameters', 'sub')
      .select([
        'param.id',
        'param.name',
        'sub.id',
        'sub.quantitativeParameterId',
        'sub.name',
      ])
      .getMany();
  }

  async findOne(name: string) {
    const riskQuantitativeParameter =
      await this.riskQuantitativeParameterRepository.findOne({
        where: { name },
      });

    if (!riskQuantitativeParameter) {
      throw new NotFoundException(
        `Risk Quantitative Parameter with name: ${name} not found.`,
      );
    }

    return {
      message: `Risk Quantitative Parameter retrieved successfully.`,
      data: {
        id: riskQuantitativeParameter.id,
        name: riskQuantitativeParameter.name,
        riskQuantitativeSubParameters:
          riskQuantitativeParameter.riskQuantitativeSubParameters.map(
            (sub) => ({
              id: sub.id,
              name: sub.name,
            }),
          ),
      },
    };
  }

  update(
    id: number,
    updateRiskQuantitativeParameterDto: UpdateRiskQuantitativeParameterDto,
  ) {
    return `This action updates a #${id} riskQuantitativeParameter`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskQuantitativeParameter`;
  }
}
