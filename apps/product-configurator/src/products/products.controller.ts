import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  RemotePermissionGuard,
  RequirePermission,
} from '../rbac/remote-permission.guard';
import {
  CreateBespokeProductDto,
  CreateProductDto,
  UpdateProductDto,
} from '../dtos';
import { ProductsService } from './products.service';

@Controller('api/products')
@UseGuards(RemotePermissionGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission('config_products_view')
  list(@Req() req) {
    return this.productsService.list(req.userContext);
  }

  @Post()
  @RequirePermission('config_products_manage')
  create(@Req() req, @Body() dto: CreateProductDto) {
    return this.productsService.createStandard(req.userContext, dto);
  }

  @Post('bespoke')
  @RequirePermission('config_products_bespoke_create')
  createBespoke(@Req() req, @Body() dto: CreateBespokeProductDto) {
    return this.productsService.createBespoke(req.userContext, dto);
  }

  @Patch(':id')
  @RequirePermission('config_products_manage')
  update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(req.userContext, id, dto);
  }
}
