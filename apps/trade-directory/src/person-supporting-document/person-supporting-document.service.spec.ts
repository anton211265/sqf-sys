import { Test, TestingModule } from '@nestjs/testing';
import { PersonSupportingDocumentService } from './person-supporting-document.service';

describe('PersonSupportingDocumentService', () => {
  let service: PersonSupportingDocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PersonSupportingDocumentService],
    }).compile();

    service = module.get<PersonSupportingDocumentService>(
      PersonSupportingDocumentService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
