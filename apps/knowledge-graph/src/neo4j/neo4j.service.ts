import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private driver: Driver;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.driver = neo4j.driver(
      this.configService.getOrThrow('NEO4J_URI'),
      neo4j.auth.basic(
        this.configService.getOrThrow('NEO4J_USERNAME'),
        this.configService.getOrThrow('NEO4J_PASSWORD'),
      ),
    );
    await this.driver.getServerInfo();
    this.logger.log('Connected to Neo4j');
    await this.ensureConstraints();
  }

  async onModuleDestroy() {
    await this.driver?.close();
  }

  // Uniqueness constraints double as lookup indexes for the MERGE upserts.
  private async ensureConstraints() {
    const constraints = [
      'CREATE CONSTRAINT company_org_id IF NOT EXISTS FOR (c:Company) REQUIRE c.orgId IS UNIQUE',
      'CREATE CONSTRAINT invoice_id IF NOT EXISTS FOR (i:Invoice) REQUIRE i.invoiceId IS UNIQUE',
      'CREATE CONSTRAINT contract_id IF NOT EXISTS FOR (c:Contract) REQUIRE c.contractId IS UNIQUE',
      'CREATE CONSTRAINT processed_event_id IF NOT EXISTS FOR (e:ProcessedEvent) REQUIRE e.eventId IS UNIQUE',
    ];
    for (const constraint of constraints) {
      await this.write(constraint);
    }
  }

  async write(cypher: string, params: Record<string, unknown> = {}) {
    const session = this.driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
      return await session.run(cypher, params);
    } finally {
      await session.close();
    }
  }

  async read(cypher: string, params: Record<string, unknown> = {}) {
    const session = this.driver.session({ defaultAccessMode: neo4j.session.READ });
    try {
      const result = await session.run(cypher, params);
      return result.records.map((record) => {
        const obj: Record<string, unknown> = {};
        for (const key of record.keys as string[]) {
          const value = record.get(key);
          obj[key] = neo4j.isInt(value) ? value.toNumber() : value;
        }
        return obj;
      });
    } finally {
      await session.close();
    }
  }
}
