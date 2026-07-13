import { randomId } from '@mantine/hooks';

// Initial values are static constants
// Object in InitialValues must follow the structure and data types define in interface
export interface PersonInCharge {
  name: string;
  emailAddress: string;
  contactNumber: string;
  designation: string;
}

export const PersonInChargeFormInitialValues: PersonInCharge = {
  name: '',
  emailAddress: '',
  contactNumber: '',
  designation: '',
};

export interface createNewApplicationDetails {
  companyName: string;
  businessRegistrationNumber: string;
  companyType: string;
  country: string;
  personInCharge: PersonInCharge;
  applicationPersona: string;
}

export const createNewApplicationInitialValues: createNewApplicationDetails = {
  companyName: '',
  businessRegistrationNumber: '',
  companyType: '',
  country: '',
  personInCharge: PersonInChargeFormInitialValues,
  applicationPersona: '',
};
export interface kycReportConsentDetails {
  name: string;
  contactNumber: string;
  consentAcknowledgement: boolean;
}

export const kycReportConsentFormInitialValues = {
  name: '',
  contactNumber: '',
  consentAcknowledgement: false,
};

export interface businessProfileDetails {
  companyName: string;
  businessRegistrationNumber: string;
  companyType: string;
  country: string;
  businessSector: string;
  businessSectorOther: string | null;
  emailAddress: string;
  contactNumber: string;
  companyWebsite: string | null;
  registeredAddress: string;
  postcode: string;
  yearEstablished: string;
  companySize: string;
  revenueCurrency: string;
  revenueAmount: number;
  taxIdentificationNumber: string;
}

export const businessProfileFormInitialValues: businessProfileDetails = {
  companyName: '',
  businessRegistrationNumber: '',
  companyType: '',
  country: '',
  businessSector: '',
  businessSectorOther: '',
  emailAddress: '',
  contactNumber: '',
  companyWebsite: '',
  registeredAddress: '',
  postcode: '',
  yearEstablished: '',
  companySize: '',
  revenueCurrency: '',
  revenueAmount: 0,
  taxIdentificationNumber: '',
};

export interface Director {
  name: string;
  identificationNumber: string;
  designation: string;
  address: string;
  contactNumber: string;
  emailAddress: string;
  authoriseSignatory: boolean | null;
  key: string;
  alsoShareholder?: boolean;
  alsoGuarantor?: boolean;
}

export const DirectorFormInitialValues: Director[] = [
  {
    name: '',
    identificationNumber: '',
    designation: '',
    address: '',
    contactNumber: '',
    emailAddress: '',
    authoriseSignatory: null,
    key: randomId(),
    alsoShareholder: false,
    alsoGuarantor: false,
  },
];

export interface Shareholder {
  name: string;
  identificationNumber: string;
  designation: string;
  address: string;
  contactNumber: string;
  emailAddress: string;
  shareholdingPercentage: number;
  key: string;
  source?: string;
}

export const ShareholderFormInitialValues: Shareholder[] = [
  {
    name: '',
    identificationNumber: '',
    designation: '',
    address: '',
    contactNumber: '',
    emailAddress: '',
    shareholdingPercentage: 0,
    key: randomId(),
  },
];

export interface Guarantors {
  name: string;
  identificationNumber: string;
  designation: string;
  address: string;
  contactNumber: string;
  emailAddress: string;
  relationshipToApplicant: string;
  key: string;
  source?: string;
}

export const GuarantorsFormInitialValues: Guarantors[] = []; // Set initial value to empty array due to UI design and behaviour
