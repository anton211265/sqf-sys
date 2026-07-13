import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OpportunitiesService } from './opportunities.service';

class NaturalLanguageQueryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}

@Controller('/api/opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  listSavedQueries() {
    return this.opportunitiesService.listSavedQueries();
  }

  @Get(':name')
  async runSavedQuery(
    @Param('name') name: string,
    @Query() overrides: Record<string, string>,
  ) {
    return this.opportunitiesService.runSavedQuery(name, overrides);
  }

  @Post('query')
  async naturalLanguageQuery(@Body() dto: NaturalLanguageQueryDto) {
    return this.opportunitiesService.naturalLanguageQuery(dto.question);
  }
}
