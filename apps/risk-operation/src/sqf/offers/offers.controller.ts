import {
  RemotePermissionGuard, RequirePermission,
} from '@app/common/rbac/remote-permission.guard';
import {
  Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { InjectEntityManager } from '@nestjs/typeorm';
import { IsIn, IsInt, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EntityManager } from 'typeorm';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ProcessedEventRepository } from '../../repositories/processed-event.repository';
import { OffersService } from './offers.service';

class CreateOfferDto {
  @IsInt() @Min(1) applicationId: number;
}
class SaveOfferDto {
  @IsObject() inputs: Record<string, any>;
}
class SimulateDto {
  @IsIn(['POST_FACTORING', 'PRE_POST_FACTORING', 'TERM_LOAN', 'SCF']) scenario: any;
  @IsObject() inputs: Record<string, any>;
}
class NoteDto {
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}
class ResolveDto extends NoteDto {
  @IsIn(['accept', 'decline', 'refresh', 'close']) action: 'accept' | 'decline' | 'refresh' | 'close';
}

/** Provisional Offer workspace endpoints (CRC pass 2). */
@Controller('api/offers')
@UseGuards(RemotePermissionGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get() @RequirePermission('risk_offers_view')
  list(@Req() req: any) { return this.offersService.list(this.ctx(req)); }

  @Get(':id') @RequirePermission('risk_offers_view')
  get(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.offersService.get(this.ctx(req), id); }

  @Post() @RequirePermission('risk_offers_manage')
  create(@Req() req: any, @Body() dto: CreateOfferDto) { return this.offersService.create(this.ctx(req), dto.applicationId); }

  @Put(':id') @RequirePermission('risk_offers_manage')
  save(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: SaveOfferDto) {
    return this.offersService.save(this.ctx(req), id, dto.inputs);
  }

  /** Stateless live preview — same engine the save/submit path uses. */
  @Post('simulate') @RequirePermission('risk_offers_view')
  simulate(@Body() dto: SimulateDto) { return this.offersService.simulatePreview(dto.scenario, dto.inputs); }

  @Post(':id/submit') @RequirePermission('risk_offers_manage')
  submit(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.offersService.submit(this.ctx(req), id); }

  @Post(':id/check') @RequirePermission('risk_offers_check')
  check(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.offersService.check(this.ctx(req), id); }

  @Post(':id/return') @RequirePermission('risk_offers_check')
  returnToDraft(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: NoteDto) {
    return this.offersService.returnToDraft(this.ctx(req), id, dto.note);
  }

  @Post(':id/approve') @RequirePermission('risk_offers_approve')
  approve(@Req() req: any, @Param('id', ParseIntPipe) id: number) { return this.offersService.approve(this.ctx(req), id); }

  @Post(':id/reject') @RequirePermission('risk_offers_approve')
  reject(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: NoteDto) {
    return this.offersService.reject(this.ctx(req), id, dto.note);
  }

  @Post(':id/resolve') @RequirePermission('risk_offers_resolve')
  resolve(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: ResolveDto) {
    return this.offersService.resolve(this.ctx(req), id, dto.action, dto.note);
  }

  private ctx(req: any) { return { personId: req.userContext.id, orgId: req.userContext.orgId }; }
}

/** RATE_CARD_PUBLISHED consumer — keeps the rate-card mirror fresh. */
@Controller()
export class RateCardMirrorConsumer {
  private readonly logger = new Logger(RateCardMirrorConsumer.name);

  constructor(
    private readonly offersService: OffersService,
    private readonly processedEventRepository: ProcessedEventRepository,
    @InjectEntityManager() private readonly entityManager: EntityManager,
  ) {}

  @EventPattern(KafkaTopicEnum.RATE_CARD_PUBLISHED)
  async handle(@Payload() event: any): Promise<void> {
    try {
      if (!event?.eventId || !Number.isInteger(event?.funderOrganizationId) || !event?.productCode) {
        this.logger.warn('Dropping malformed RATE_CARD_PUBLISHED event');
        return;
      }
      if (await this.processedEventRepository.exists(event.eventId)) return;
      await this.offersService.upsertMirror(event);
      await this.entityManager.transaction(async (manager) => {
        await this.processedEventRepository.record(manager, {
          id: event.eventId, topic: KafkaTopicEnum.RATE_CARD_PUBLISHED,
        });
      });
      this.logger.log(`Rate-card mirror updated: ${event.productCode} v${event.versionNumber} (funder ${event.funderOrganizationId})`);
    } catch (error) {
      this.logger.error(`RATE_CARD_PUBLISHED handling failed (dropped): ${(error as Error).message}`);
    }
  }
}
