import { faker } from '@faker-js/faker';
import { ApplicationPublic } from 'apps/risk-operation/src/models';

const mockApplicationPublic = (args: {
  dateContext: Date;
}): ApplicationPublic => {
  const applicationPublic = new ApplicationPublic({
    uuid: faker.string.uuid(),
    expiryDateTime: faker.date.future({
      refDate: args.dateContext,
      years: 100,
    }),
  });

  return applicationPublic;
};

export { mockApplicationPublic };
