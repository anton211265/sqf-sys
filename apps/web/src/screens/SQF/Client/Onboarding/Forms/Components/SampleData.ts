import { randomId } from '@mantine/hooks';

import {
  kycReportConsentDetails,
  businessProfileDetails,
  PersonInCharge,
  Director,
  Shareholder,
  Guarantors,
} from './InitialValues';

// Sample data for KYC report consent Details
export const sampleKycReportConsentData: kycReportConsentDetails = {
  name: 'John Doe',
  contactNumber: '+1234567890',
  consentAcknowledgement: true,
};

// Sample data for Business Profile
export const sampleBusinessProfileData: businessProfileDetails = {
  companyName: 'Tech Innovators Inc.',
  businessRegistrationNumber: '123456789',
  companyType: 'PRIVATE_LIMITED',
  country: 'MY',
  businessSector: 'SUPPLY_AND_SERVICES',
  businessSectorOther: null,
  emailAddress: 'info@techinnovators.com',
  contactNumber: '+6587654321',
  companyWebsite: 'https://www.techinnovators.com',
  registeredAddress: '123 Innovation Blvd, Suite 100',
  postcode: '10001',
  yearEstablished: '2024',
  companySize: '251-500',
  revenueCurrency: 'USD',
  revenueAmount: 5000000,
  taxIdentificationNumber: 'AA 12345678912',
};

// Sample data for Directors
export const sampleDirectorsData: Director[] = [
  {
    name: 'Bob Smith',
    identificationNumber: 'ID987654321',
    designation: 'CTO',
    address: '456 Tech Park, Floor 2',
    contactNumber: '+1987654321',
    emailAddress: 'bob.smith@techinnovators.com',
    authoriseSignatory: true,
    key: randomId(),
    alsoShareholder: false,
    alsoGuarantor: false,
  },
  {
    name: 'Alice Johnson',
    identificationNumber: 'ID123456789',
    designation: 'CEO',
    address: '123 Business Rd, Suite 300',
    contactNumber: '+1234567890',
    emailAddress: 'alice.johnson@innovatech.com',
    authoriseSignatory: false,
    key: randomId(),
    alsoShareholder: false,
    alsoGuarantor: false,
  },
];

// Sample data for Shareholders
export const sampleShareholdersData: Shareholder[] = [
  {
    name: 'Carol Davis',
    identificationNumber: 'ID654321987',
    designation: 'Shareholder',
    address: '789 Investment Ave, Unit 5',
    contactNumber: '+1122334455',
    emailAddress: 'carol.davis@techinnovators.com',
    shareholdingPercentage: 25,
    key: randomId(),
  },
];

// Sample data for Guarantors
export const sampleGuarantorsData: Guarantors[] = [
  {
    name: 'David Wilson',
    identificationNumber: 'ID123456789',
    designation: 'Guarantor',
    address: '321 Guarantee St',
    contactNumber: '+1222333444',
    emailAddress: 'david.wilson@guarantors.com',
    relationshipToApplicant: 'Partner',
    key: randomId(),
  },
];
