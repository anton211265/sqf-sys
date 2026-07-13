import { LoggerModule } from '@app/common/logger/logger.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { z } from 'zod';
import { GraphSyncController } from './graph-sync/graph-sync.controller';
import { GraphSyncService } from './graph-sync/graph-sync.service';
import { Neo4jService } from './neo4j/neo4j.service';
import { OpportunitiesController } from './opportunities/opportunities.controller';
import { OpportunitiesService } from './opportunities/opportunities.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return z
          .object({
            PORT: z.coerce.number(),
            KAFKA_BROKERS: z.string(),
            KAFKA_BROKER_SSL: z.string(),
            NEO4J_URI: z.string(),
            NEO4J_USERNAME: z.string(),
            NEO4J_PASSWORD: z.string(),
            FRONTEND_DOMAIN: z.string(),
            JWT_SECRET: z.string(),
            // Optional: GraphRAG natural-language querying + pitch drafting.
            ANTHROPIC_API_KEY: z.string().optional(),
            ANTHROPIC_MODEL: z.string().optional(),
          })
          .parse(config);
      },
    }),
  ],
  controllers: [GraphSyncController, OpportunitiesController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    Neo4jService,
    GraphSyncService,
    OpportunitiesService,
  ],
})
export class KnowledgeGraphModule {}
