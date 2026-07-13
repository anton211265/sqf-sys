import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/create-invoice.dto';

// Intended access (future dynamic RBAC): CLIENT uploads own invoices,
// RELATIONSHIP_MANAGER + RISK_OFFICER validate/manage. Do not add hardcoded
// CASL rules here.
@Controller('/api/invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  async create(
    @CurrentUser() user: IUserContext,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoiceService.create(user, dto);
  }

  @Get()
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'issuerOrganizationId', required: false, type: Number })
  @ApiQuery({ name: 'debtorOrganizationId', required: false, type: Number })
  @ApiQuery({ name: 'relationshipId', required: false, type: Number })
  async findAll(
    @CurrentUser() user: IUserContext,
    @Query('status') status?: string,
    @Query('issuerOrganizationId') issuerOrganizationId?: number,
    @Query('debtorOrganizationId') debtorOrganizationId?: number,
    @Query('relationshipId') relationshipId?: number,
  ) {
    return this.invoiceService.findAll(user, {
      status,
      issuerOrganizationId: issuerOrganizationId
        ? Number(issuerOrganizationId)
        : undefined,
      debtorOrganizationId: debtorOrganizationId
        ? Number(debtorOrganizationId)
        : undefined,
      relationshipId: relationshipId ? Number(relationshipId) : undefined,
    });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.invoiceService.findById(user, id);
  }

  @Post(':id/status')
  async updateStatus(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoiceService.updateStatus(user, id, dto);
  }
}
