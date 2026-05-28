import { FacilityTypeEnum } from '@app/common/apps/risk-operation/enums/facility-type.enum';
import { faker } from '@faker-js/faker';
import { Facility } from 'apps/risk-operation/src/models';

const mockFacility = (args: { dateContext: Date }): Facility => {
  const creditPeriodEndDate = faker.date.future({
    refDate: args.dateContext,
    years: 1,
  });
  const facility = new Facility({
    facilityType: faker.helpers.enumValue(FacilityTypeEnum),
    facilityLimit: faker.number.float({ max: 10000000 }),
    remark: faker.lorem.sentence(),
    marginOfFactoring: faker.number.float({ max: 1 }),
    creditPeriodEndDate,
    gracePeriodEndDate: faker.date.future({
      refDate: creditPeriodEndDate,
      years: 1,
    }),
    profitRateT1: faker.number.float({ max: 1 }),
    profitRateT2: faker.number.float({ max: 1 }),
  });

  return facility;
};

export { mockFacility };
