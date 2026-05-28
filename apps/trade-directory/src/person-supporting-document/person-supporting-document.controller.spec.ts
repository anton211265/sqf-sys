import { Test, TestingModule } from '@nestjs/testing';
import { PersonSupportingDocumentController } from './person-supporting-document.controller';
import { PersonSupportingDocumentService } from './person-supporting-document.service';

describe('PersonSupportingDocumentController', () => {
  let controller: PersonSupportingDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonSupportingDocumentController],
      providers: [PersonSupportingDocumentService],
    }).compile();

    controller = module.get<PersonSupportingDocumentController>(
      PersonSupportingDocumentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
