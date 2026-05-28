import { ApplicationSupportingDocumentTypeEnum } from '@app/common/apps/risk-operation/enums/application-supporting-document-type.enum';
import { faker } from '@faker-js/faker';
import { ApplicationSupportingDocument } from 'apps/risk-operation/src/models';

const mockApplicationSupportingDocument = (args: {
  bucketKey: string;
}): ApplicationSupportingDocument => {
  const applicationSupportingDocument = new ApplicationSupportingDocument({
    bucketKey: args.bucketKey,
    supportingDocumentType: faker.helpers.enumValue(
      ApplicationSupportingDocumentTypeEnum,
    ),
    fileExtension: faker.system.fileExt(),
    isActive: true,
  });

  return applicationSupportingDocument;
};

export { mockApplicationSupportingDocument };
