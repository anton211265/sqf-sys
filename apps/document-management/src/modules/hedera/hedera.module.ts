import { Module } from '@nestjs/common';
import { HEDERA_SERVICE } from './hedera.interface';
import { HederaService } from './hedera.service';

@Module({
  providers: [
    {
      provide: HEDERA_SERVICE,
      useClass: HederaService,
    },
  ],
  exports: [HEDERA_SERVICE],
})
export class HederaModule {}
