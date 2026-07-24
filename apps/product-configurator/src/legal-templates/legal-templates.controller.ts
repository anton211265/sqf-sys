import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import { BindTemplatesDto, CreateTemplateDto } from '../dtos';
import { LegalTemplatesService } from './legal-templates.service';

@Controller('api')
@UseGuards(RemotePermissionGuard)
export class LegalTemplatesController {
  constructor(private readonly legalTemplatesService: LegalTemplatesService) {}

  @Get('legal-templates')
  @RequirePermission('config_products_view')
  list(@Req() req) {
    return this.legalTemplatesService.list(req.userContext);
  }

  @Post('legal-templates')
  @RequirePermission('config_legal_templates_manage')
  create(@Req() req, @Body() dto: CreateTemplateDto) {
    return this.legalTemplatesService.create(req.userContext, dto);
  }

  @Get('products/:productId/legal-templates')
  @RequirePermission('config_products_view')
  listForProduct(
    @Req() req,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.legalTemplatesService.listForProduct(
      req.userContext,
      productId,
    );
  }

  @Put('products/:productId/legal-templates')
  @RequirePermission('config_legal_templates_manage')
  bind(
    @Req() req,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: BindTemplatesDto,
  ) {
    return this.legalTemplatesService.bindToProduct(
      req.userContext,
      productId,
      dto,
    );
  }
}
