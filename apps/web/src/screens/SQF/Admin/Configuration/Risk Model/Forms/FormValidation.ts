import { nonEmptyStringWithMinLength } from 'screens/SQF/Client/Onboarding/Forms/Components/FormValidation';
import { z } from 'zod';

export const createNewRiskModelValidator = z.object({
  riskModelName: nonEmptyStringWithMinLength('Risk Model Name'),
  description: nonEmptyStringWithMinLength('Description'),
});

export const createNewRiskFactorValidator = z.object({
  riskFactorName: nonEmptyStringWithMinLength('Name'),
});
