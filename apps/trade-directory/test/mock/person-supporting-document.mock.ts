import { PersonSupportingDocumentTypeEnum } from '@app/common/apps/trade-directory/enums/person-supporting-document';
import { faker } from '@faker-js/faker';
import { PersonSupportingDocument } from 'apps/trade-directory/src/models';

const mockPersonSupportingDocument = (args: {
  bucketKey: string;
}): PersonSupportingDocument => {
  const organizationPersonSupportingDocument = new PersonSupportingDocument({
    bucketKey: args.bucketKey,
    supportingDocumentType: faker.helpers.enumValue(
      PersonSupportingDocumentTypeEnum,
    ),
  });

  return organizationPersonSupportingDocument;
};

export { mockPersonSupportingDocument };
