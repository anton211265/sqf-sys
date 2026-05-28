import { DatabaseModule } from '@app/common/database/database.module';
import { Module } from '@nestjs/common';
import { PersonSupportingDocument } from '../models';
import { PersonSupportingDocumentRepository } from '../repositories';
import { PersonSupportingDocumentController } from './person-supporting-document.controller';
import { PersonSupportingDocumentService } from './person-supporting-document.service';

@Module({
  imports: [DatabaseModule.forFeature([PersonSupportingDocument])],
  controllers: [PersonSupportingDocumentController],
  providers: [
    PersonSupportingDocumentService,
    PersonSupportingDocumentRepository,
  ],
})
export class PersonSupportingDocumentModule {}
