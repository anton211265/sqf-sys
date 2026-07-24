import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CrcService } from './crc.service';

/**
 * DTO note (ValidationPipe whitelist trap): every property MUST carry a
 * decorator or it arrives stripped/undefined. The deep model structure
 * (factors/overrides/thresholds/answers) is passed as raw arrays/objects
 * here and validated far more thoroughly in scoring-engine.ts — nested
 * class-validator DTOs would duplicate that engine, worse.
 */
class SaveModelDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  riskModelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(['SIMPLE_WEIGHTED', 'MULTI_FACTOR'])
  modelShape?: string;

  @IsOptional()
  @IsObject()
  thresholds?: { low: [number, number]; medium: [number, number]; high: [number, number] };

  @IsOptional()
  @IsArray()
  factors?: any[];

  @IsOptional()
  @IsArray()
  overrides?: any[];
}

class CreateModelDto extends SaveModelDto {
  @IsString()
  @MaxLength(120)
  riskModelName: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duplicateFromId?: number;
}

class ReturnDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

class ConductAssessmentDto {
  @IsInt()
  @Min(1)
  riskModelId: number;

  @IsInt()
  @Min(1)
  organizationId: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  organizationName?: string;

  @IsObject()
  answers: { nodes: Record<string, any>; overrides: Record<string, boolean> };
}

/**
 * CRC pass 1 — Filter-2 risk model authoring, maker-checker lifecycle and
 * qualitative assessments. Governed replacement for the unregistered 2024
 * risk-model CRUD modules (per-domain swap). Tenant scope = caller's JWT
 * orgId; SQFSYS (orgId 0) reads all, writes nothing.
 */
@Controller('api/crc')
@UseGuards(RemotePermissionGuard)
export class CrcController {
  constructor(private readonly crcService: CrcService) {}

  // ---------------- Models ----------------

  @Get('risk-models')
  @RequirePermission('risk_models_view')
  listModels(@Req() req: any, @Query('status') status?: string) {
    return this.crcService.listModels(this.ctx(req), status);
  }

  @Get('risk-models/:id')
  @RequirePermission('risk_models_view')
  getModel(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.getModel(this.ctx(req), id);
  }

  @Post('risk-models')
  @RequirePermission('risk_models_edit')
  createModel(@Req() req: any, @Body() dto: CreateModelDto) {
    return this.crcService.createModel(this.ctx(req), dto);
  }

  @Put('risk-models/:id')
  @RequirePermission('risk_models_edit')
  updateModel(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: SaveModelDto) {
    return this.crcService.updateModel(this.ctx(req), id, dto);
  }

  @Post('risk-models/:id/submit')
  @RequirePermission('risk_models_edit')
  submit(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.submit(this.ctx(req), id);
  }

  @Post('risk-models/:id/check')
  @RequirePermission('risk_models_check')
  check(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.checkModel(this.ctx(req), id);
  }

  /** Checker sends a submitted model back to the maker. */
  @Post('risk-models/:id/return')
  @RequirePermission('risk_models_check')
  returnToDraft(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: ReturnDto) {
    return this.crcService.returnModel(this.ctx(req), id, dto.note, false);
  }

  /** CM rejects a checked model back to draft. */
  @Post('risk-models/:id/reject')
  @RequirePermission('risk_models_publish')
  reject(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: ReturnDto) {
    return this.crcService.returnModel(this.ctx(req), id, dto.note, true);
  }

  @Post('risk-models/:id/publish')
  @RequirePermission('risk_models_publish')
  publish(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.publish(this.ctx(req), id);
  }

  @Post('risk-models/:id/archive')
  @RequirePermission('risk_models_publish')
  archive(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.archive(this.ctx(req), id);
  }

  // ---------------- Assessments ----------------

  @Get('assessments')
  @RequirePermission('risk_assessments_view')
  listAssessments(@Req() req: any, @Query('organizationId') organizationId?: string) {
    const orgFilter = organizationId ? parseInt(organizationId, 10) : undefined;
    return this.crcService.listAssessments(
      this.ctx(req),
      Number.isInteger(orgFilter) ? orgFilter : undefined,
    );
  }

  @Get('assessments/:id')
  @RequirePermission('risk_assessments_view')
  getAssessment(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.crcService.getAssessment(this.ctx(req), id);
  }

  @Post('assessments')
  @RequirePermission('risk_assessments_conduct')
  conduct(@Req() req: any, @Body() dto: ConductAssessmentDto) {
    return this.crcService.conductAssessment(this.ctx(req), dto);
  }

  private ctx(req: any) {
    return { personId: req.userContext.id, orgId: req.userContext.orgId };
  }
}
