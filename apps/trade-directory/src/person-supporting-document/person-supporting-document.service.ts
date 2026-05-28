import { Injectable } from '@nestjs/common';
import { PersonSupportingDocumentRepository } from '../repositories';

type GetPersonSupportingDocumentsArgs = {
  pageSize?: number;
  pageNumber?: number;
};

@Injectable()
export class PersonSupportingDocumentService {
  constructor(
    private readonly personSupportingDocumentRepository: PersonSupportingDocumentRepository,
  ) {}

  getPersonSupportingDocuments = async (
    personId: number,
    { pageSize = 50, pageNumber = 1 }: GetPersonSupportingDocumentsArgs,
  ) => {
    const [personSupportingDocuments, totalCount] =
      await this.personSupportingDocumentRepository.findAndCount({
        where: {
          person: {
            id: personId,
          },
        },
        order: {
          createdAt: 'ASC',
        },
        take: pageSize,
        skip: (pageNumber - 1) * pageSize,
      });

    return {
      personSupportingDocuments,
      pageNumber,
      pageSize,
      currentCount: Math.min(personSupportingDocuments.length, pageSize),
      totalCount,
    };
  };
}
