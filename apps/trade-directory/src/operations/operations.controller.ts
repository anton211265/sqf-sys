import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import { UserContext } from '@app/common/decorators/user-context.decorator';
import {
  Body, Controller, Get, Ip, Param, ParseIntPipe, Post, UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { BearerContextGuard } from '../auth/guards/bearer-context.guard';
import { PermissionGuard, RequirePermission } from '../rbac/permission.guard';
import { OperationsService } from './operations.service';

class NoteDto {
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}
class SignDto {
  @IsString() esignToken: string;
}

/** Operations Hub — funder-side case queue + agreement chain. */
@Controller('api/operations')
@UseGuards(PermissionGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get('cases') @RequirePermission('ops_queue_view')
  list(@UserContext() user: IUserContext) {
    return this.operationsService.list({ personId: user.id, orgId: user.orgId });
  }

  @Get('cases/:id') @RequirePermission('ops_queue_view')
  get(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.get({ personId: user.id, orgId: user.orgId }, id);
  }

  @Post('cases/:id/pickup') @RequirePermission('ops_agreements_manage')
  pickup(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.pickup({ personId: user.id, orgId: user.orgId }, id);
  }

  @Post('cases/:id/submit') @RequirePermission('ops_agreements_manage')
  submit(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.submit({ personId: user.id, orgId: user.orgId }, id);
  }

  @Post('cases/:id/check') @RequirePermission('ops_agreements_check')
  check(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.check({ personId: user.id, orgId: user.orgId }, id);
  }

  @Post('cases/:id/return') @RequirePermission('ops_agreements_check')
  returnCase(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number, @Body() dto: NoteDto) {
    return this.operationsService.returnToPreparation({ personId: user.id, orgId: user.orgId }, id, dto.note);
  }

  @Post('cases/:id/approve') @RequirePermission('ops_agreements_approve')
  approve(@UserContext() user: IUserContext, @Param('id', ParseIntPipe) id: number) {
    return this.operationsService.approve({ personId: user.id, orgId: user.orgId }, id);
  }
}

/** Client (portal) side: view + passkey-sign the facility agreement. */
@Controller('portal/agreement')
@UseGuards(BearerContextGuard)
export class PortalAgreementController {
  constructor(private readonly operationsService: OperationsService) {}

  @Get()
  view(@UserContext() user: IUserContext) {
    return this.operationsService.portalView(user.orgId);
  }

  @Post('sign')
  sign(@UserContext() user: IUserContext, @Body() dto: SignDto, @Ip() ip: string) {
    return this.operationsService.portalSign(user.orgId, user.id, dto.esignToken, ip ?? null);
  }
}
