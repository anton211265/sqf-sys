import { DatabaseModule } from '@app/common/database/database.module';
import { OutboxEvent } from '@app/common/database/outbox-event.entity';
import { Module } from '@nestjs/common';
import { Organization, Relationship } from '../models';
import {
  OrganizationRepository,
  OutboxEventRepository,
  RelationshipRepository,
} from '../repositories';
import { DirectoryController } from './directory.controller';
import { RelationshipController } from './relationship.controller';
import { RelationshipService } from './relationship.service';

@Module({
  imports: [
    DatabaseModule.forFeature([Relationship, Organization, OutboxEvent]),
  ],
  controllers: [RelationshipController, DirectoryController],
  providers: [
    RelationshipService,
    RelationshipRepository,
    OrganizationRepository,
    OutboxEventRepository,
  ],
  exports: [RelationshipService],
})
export class RelationshipModule {}
