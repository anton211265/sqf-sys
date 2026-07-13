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
import { RelationshipService } from './relationship.service';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
} from './dto/create-relationship.dto';

// Intended access (future dynamic RBAC): RELATIONSHIP_MANAGER manage,
// RISK_OFFICER read. Do not add hardcoded CASL rules here.
@Controller('/api/relationships')
@UseGuards(JwtAuthGuard)
export class RelationshipController {
  constructor(private readonly relationshipService: RelationshipService) {}

  @Post()
  async create(
    @CurrentUser() user: IUserContext,
    @Body() dto: CreateRelationshipDto,
  ) {
    return this.relationshipService.create(user, dto);
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @CurrentUser() user: IUserContext,
    @Query('organizationId') organizationId?: number,
    @Query('status') status?: string,
  ) {
    return this.relationshipService.findAll(user, {
      organizationId: organizationId ? Number(organizationId) : undefined,
      status,
    });
  }

  @Get(':id')
  async findById(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.relationshipService.findById(user, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: IUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.relationshipService.update(user, id, dto);
  }
}
