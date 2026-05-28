import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRiskApplicationAuditLogDto } from './dto/create-risk-application-audit-log.dto';
import { UpdateRiskApplicationAuditLogDto } from './dto/update-risk-application-audit-log.dto';
import { RiskApplicationAuditLogRepository } from '../../repositories/risk-application-audit-log.repository';
import { RiskApplicationAuditLog } from '../../models/risk-application-audit-log.entity';
import { ApplicationRepository } from '../../repositories/application.repository';
import { RiskApplicationAuditActionLabels } from '@app/common/apps/risk-operation/enums/risk-application-audit-action.enum';

@Injectable()
export class RiskApplicationAuditLogService {
  constructor(
    private readonly riskApplicationAuditLogRepository: RiskApplicationAuditLogRepository,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async create(
    createRiskApplicationAuditLogDto: CreateRiskApplicationAuditLogDto,
  ) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: {
        applicationNumber: createRiskApplicationAuditLogDto.applicationNumber,
      },
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${createRiskApplicationAuditLogDto.applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    try {
      const newRiskAuditLog = new RiskApplicationAuditLog({
        riskApplicationScoringId: riskApplicationScoring.id,
        performedBy: createRiskApplicationAuditLogDto.performedBy,
        details:
          RiskApplicationAuditActionLabels[
            createRiskApplicationAuditLogDto.actionType
          ],
        actionType: createRiskApplicationAuditLogDto.actionType,
      });

      const savedRiskAuditLog =
        await this.riskApplicationAuditLogRepository.save(newRiskAuditLog);

      return {
        message: `Audit log entry for applicationNumber: ${createRiskApplicationAuditLogDto.applicationNumber} stored successfully.`,
        statusCode: HttpStatus.CREATED,
        data: savedRiskAuditLog,
      };
    } catch (error) {
      console.error(
        `Error storing audit log entry for applicationNumber: ${createRiskApplicationAuditLogDto.applicationNumber}`,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Error to store audit log entry for applicationNumber: ${createRiskApplicationAuditLogDto.applicationNumber}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAuditLogsByApplicationNumber(applicationNumber: string) {
    // Check if application exists
    const application = await this.applicationRepository.findOne({
      where: {
        applicationNumber,
      },
      relations: ['riskApplicationScoring'],
    });

    if (!application) {
      throw new NotFoundException(
        `Application with applicationNumber: ${applicationNumber} not found.`,
      );
    }

    // Get riskApplicationScoring entity
    const riskApplicationScoring = application.riskApplicationScoring;

    try {
      const riskAuditlogs = await this.riskApplicationAuditLogRepository.find({
        where: { riskApplicationScoringId: riskApplicationScoring.id },
        select: {
          actionType: true,
          performedBy: true,
          details: true,
          createdAt: true,
        },
        order: { createdAt: 'DESC' },
      });

      return {
        message: `Risk Audit Logs for applicationNumber: ${applicationNumber} retrieved successfully.`,
        statusCode: HttpStatus.OK,
        data: riskAuditlogs,
      };
    } catch (error) {
      console.error(
        `Error retrieving Risk Audit Logs for applicationNumber: ${applicationNumber}. `,
        error,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to retrieve Risk Audit Logs for applicationNumber: ${applicationNumber}.`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  findAll() {
    return `This action returns all riskApplicationAuditLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} riskApplicationAuditLog`;
  }

  update(
    id: number,
    updateRiskApplicationAuditLogDto: UpdateRiskApplicationAuditLogDto,
  ) {
    return `This action updates a #${id} riskApplicationAuditLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskApplicationAuditLog`;
  }
}
