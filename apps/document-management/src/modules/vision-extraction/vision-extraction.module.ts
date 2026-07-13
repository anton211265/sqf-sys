import { Module } from '@nestjs/common';
import { VISION_EXTRACTION_SERVICE } from './vision-extraction.interface';
import { VisionExtractionService } from './vision-extraction.service';

@Module({
  providers: [
    { provide: VISION_EXTRACTION_SERVICE, useClass: VisionExtractionService },
  ],
  exports: [VISION_EXTRACTION_SERVICE],
})
export class VisionExtractionModule {}
