import { PartialType } from '@nestjs/swagger';
import { CreateRiskApplicationAuditLogDto } from './create-risk-application-audit-log.dto';

export class UpdateRiskApplicationAuditLogDto extends PartialType(CreateRiskApplicationAuditLogDto) {}
