import { Module, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BuyerPersonaSubscriber } from './buyer-persona.subscriber';
import { ClientPersonaSubscriber } from './client-persona.subscriber';
import { SupplierPersonaSubscriber } from './supplier-persona.subscriber';

// Registers the persona @EventSubscriber()s onto the running DataSource.
//
// @EventSubscriber() only populates TypeORM's decorator metadata — a
// DataSource never picks it up unless the class is listed in the
// `subscribers` connection option (or matched by a subscribers glob), and
// libs/common/src/database/database.module.ts's TypeOrmModule.forRootAsync
// passes neither. That's shared across all 6 services, so rather than touch
// it (and every place it's bare-imported), push instances onto the
// already-initialized DataSource here — the standard way to get NestJS DI
// into a TypeORM subscriber anyway, in case these ever need injected deps.
@Module({})
export class PersonaSubscribersModule implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  onModuleInit() {
    this.dataSource.subscribers.push(
      new SupplierPersonaSubscriber(),
      new BuyerPersonaSubscriber(),
      new ClientPersonaSubscriber(),
    );
  }
}
