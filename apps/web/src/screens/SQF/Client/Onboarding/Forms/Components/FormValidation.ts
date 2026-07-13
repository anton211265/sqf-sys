import { z } from 'zod';
import { companyType } from 'constants/companyType';
import { countries, currencyList } from 'constants/countries';
import { businessSectors } from 'constants/businessSector';
import { numberOfEmployees } from 'constants/numberOfEmployees';
import { guarantorRelationship } from 'constants/guarantorRelationship';

// Info: Validating empty string cannot be done explained https://github.com/colinhacks/zod/issues/2870

const alphabetical = z.string().regex(/^[a-zA-Z\s]+$/, {
  message: 'Alphabets only',
});
const alphanumericSpaceRegex = /^[a-zA-Z0-9\s,.-]+$/;
const alphanumericSpace = z
  .string()
  .regex(alphanumericSpaceRegex, { message: 'Alphanumeric only' });
const companyTypeCodes = companyType.map((type) => type.code);
const countryNames = countries.map((country) => country.code);
const businessSectorNames = businessSectors.map((sector) => sector.code);
const guarantorRelationshipToApplicant = guarantorRelationship.map(
  (relationship) => relationship.value
);
const companySize = numberOfEmployees.map(
  (numberOfEmployees) => numberOfEmployees.name
);
const currency = currencyList.map((currencyList) => currencyList.label);
const email = z
  .string()
  .email({ message: 'Email Address is invalid' })
  .refine((val) => val.trim() !== '', {
    message: 'Email address is required',
  }); // Ensure it's not empty or only whitespace;

const phoneRegex = /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/;
const contactNumber = z
  .string()
  .regex(phoneRegex, { message: 'Contact Number is invalid' });

const tinRegex =
  /^(IG\d{9,11}|(C|CS|D|E|F|FA|PT|TA|TC|TN|TR|TP|J|LE)\d{10,11})$/;

const nonEmptyStringWithMinLength = (
  fieldName: string,
  minLength?: number,
  isRequired = true
) => {
  let schema = z.string().refine((val) => val.trim() !== '', {
    message: isRequired
      ? `${fieldName} is required`
      : `${fieldName} cannot be empty`,
  });

  // Conditionally add the min length validation
  if (minLength !== undefined) {
    schema = z
      .string()
      .min(minLength, {
        message: `${fieldName} must be at least ${minLength} characters long`,
      })
      .refine((val) => val.trim() !== '', {
        message: isRequired
          ? `${fieldName} is required`
          : `${fieldName} cannot be empty`,
      });
  }

  return schema;
};

const icOrPassportSchema = z
  .string()
  .min(1, 'IC / Passport number is required')
  .refine(
    (val) => {
      const icRegex = /^\d{12}$/; // exactly 12 digits, no dashes
      const passportRegex = /^[A-Z0-9]{6,9}$/i; // e.g. A1234567
      return icRegex.test(val) || passportRegex.test(val);
    },
    {
      message: 'Invalid IC or Passport Number format',
    }
  );

export {
  nonEmptyStringWithMinLength,
  icOrPassportSchema,
  contactNumber,
  email,
};

// -----------------------------Create New Application Form validator----------------------------

const personInChargeValidator = z.object({
  name: nonEmptyStringWithMinLength('Name', 2),
  emailAddress: email,
  contactNumber: contactNumber,
  designation: nonEmptyStringWithMinLength('Designation', 2),
});

export const createNewApplicationValidator = z.object({
  companyName: nonEmptyStringWithMinLength('Company Name', 2),
  businessRegistrationNumber: nonEmptyStringWithMinLength(
    'Business Registration No.'
  ),
  companyType: z.enum([...companyTypeCodes] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Company Type is invalid' };
    },
  }),
  personInCharge: personInChargeValidator,
});

// -----------------------------Create New Application Form validator----------------------------

// -----------------------------KYC report consent Form validator----------------------------

export const kycReportConsentValidator = z.object({
  emailAddress: email,
  contactNumber: contactNumber,
  consentAcknowledgement: z.boolean(),
});

// -----------------------------KYC report consent Form validator----------------------------

// --------------------------------Business Profile Form validator--------------------------------

export const businessProfileValidator = z.object({
  companyName: nonEmptyStringWithMinLength('Company Name', 2),
  businessRegistrationNumber: z.string(),
  companyType: z.enum([...companyTypeCodes] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Company Type is invalid' };
    },
  }),
  country: z.enum([...countryNames] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Country is invalid' };
    },
  }),
  businessSector: z.enum([...businessSectorNames] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Business Sector is invalid' };
    },
  }),
  emailAddress: email,
  contactNumber: contactNumber,
  companyWebsite: z.string().nullable().optional(),
  registeredAddress: nonEmptyStringWithMinLength('Registered Address'),
  postcode: z
    .string()
    .max(5, { message: 'Postcode must be at most 5 characters long' }),
  yearEstablished: z.string(),
  companySize: z.enum([...companySize] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Company Size is invalid' };
    },
  }),
  revenueCurrency: z.enum([...currency] as [string, ...string[]], {
    errorMap: () => {
      return { message: 'Currency is invalid' };
    },
  }),
  revenueAmount: z
    .number()
    .nonnegative()
    .or(z.literal(NaN)) // Allow NaN, which can come from empty input
    .transform((val) => (isNaN(val) ? 0 : val)), // Transform NaN (empty) to 0,

  // Individual TIN
  // - Starts with IG
  // - Followed by 9 to 11 digits

  // Non-Individual TINs
  // - Start with one of these codes: C, CS, D, E, F, FA, PT, TA, TC, TN, TR, TP, J, LE
  // - Followed by 10-11 digits
  taxIdentificationNumber: z.string().regex(tinRegex, {
    message:
      'TIN must start with IG followed by 9–11 digits (for individual) or a valid code (C, CS, D, E, F, FA, PT, TA, TC, TN, TR, TP, J, LE) followed by 10–11 digits (for non-individual).',
  }),
});

// --------------------------------Business Profile Form validator--------------------------------

// ----------------------------Representative Details Form validator------------------------------

const directorsValidator = z.object({
  name: nonEmptyStringWithMinLength('Name', 2),
  identificationNumber: icOrPassportSchema,
  designation: nonEmptyStringWithMinLength('Designation', 2),
  address: nonEmptyStringWithMinLength('Address'),
  contactNumber: contactNumber,
  emailAddress: email,
  authoriseSignatory: z.boolean(),
});

const shareholdersValidator = z.object({
  name: nonEmptyStringWithMinLength('Name', 2),
  identificationNumber: icOrPassportSchema,
  designation: nonEmptyStringWithMinLength('Designation', 2),
  address: nonEmptyStringWithMinLength('Address'),
  contactNumber: contactNumber,
  emailAddress: email,
  shareholdingPercentage: z
    .number()
    .min(0)
    .max(100, 'Percentage must be between 0 and 100')
    .nonnegative()
    .or(z.literal(NaN)) // Allow NaN, which can come from empty input
    .transform((val) => (isNaN(val) ? 0 : val)), // Transform NaN (empty) to 0,
});

const guarantorsValidator = z.object({
  name: nonEmptyStringWithMinLength('Name', 2, false),
  identificationNumber: icOrPassportSchema,
  designation: nonEmptyStringWithMinLength('Designation', 2, false),
  address: nonEmptyStringWithMinLength('Address', undefined, false),
  contactNumber: contactNumber,
  emailAddress: email,
  relationshipToApplicant: z.enum(
    [...guarantorRelationshipToApplicant] as [string, ...string[]],
    {
      errorMap: () => {
        return { message: 'Relationship to Applicant is invalid' };
      },
    }
  ),
});

export const formValidator = z.object({
  // personInCharge: personInChargeValidator,
  directors: z.array(directorsValidator),
  shareholders: z.array(shareholdersValidator),
  guarantors: z.array(guarantorsValidator),
});

// ----------------------------Representative Details Form validator------------------------------
