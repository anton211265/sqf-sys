import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ContractService } from './contract.service';
import { CreateContractDto, UpdateContractDto } from './dto/create-contract.dto';

// Intended access (future dynamic RBAC): RELATIONSHIP_MANAGER manage,
// RISK_OFFICER read. Do not add hardcoded CASL rules here.
@Controller('/api/contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  async create(
    @CurrentUser() user: IUserContext,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractService.create(user, dto);
  }

  @Get()
  @ApiQuery({ name: 'contractType', required: false })
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  async findAll(
    @CurrentUser() user: IUserContext,
    @Query('contractType') contractType?: string,
    @Query('organizationId') organizationId?: number,
  ) {
    return this.contractService.findAll(user, {
      contractType,
      organizationId: organizationId ? Number(organizationId) : undefined,
    });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.contractService.findById(user, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractService.update(user, id, dto);
  }
}
