import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/common/database/database.module';
import { ProcessedEvent } from '@app/common/database/processed-event.entity';
import { InvoiceModule } from '../../invoice/invoice.module';
import { ProcessedEventRepository } from '../../repositories';
import { InvoiceIntakeController } from './invoice-intake.controller';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([ProcessedEvent]),
    InvoiceModule,
  ],
  controllers: [InvoiceIntakeController],
  providers: [ProcessedEventRepository],
})
export class InvoiceIntakeModule {}
