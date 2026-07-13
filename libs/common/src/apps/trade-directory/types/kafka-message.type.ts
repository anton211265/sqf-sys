import { CreatePersonDto } from 'apps/trade-directory/src/sqf/person/dto/create-person.dto';
import { KycReportTypeEnum } from '../enums/kyc-report-type.enum';
import { KycAgencyReport } from './kyc-report.type';
import {
  CreateOrganizationType,
  Organization,
  UpdatableOrganization,
} from './organization.type';
import {
  Organization as OrganizationEntity,
  OrganizationPerson as OrganizationPersonEntity,
} from 'apps/trade-directory/src/models';
import { ApplicationPersonTypeEnum } from '../../risk-operation/enums/application-person-type.enum';

// ----------------------- SQF -----------------------

export type CreateOrganizationKafkaMessageType = {
  data: CreateOrganizationType;
};

export type CreateOrganizationKafkaMessageReplyType = OrganizationEntity;

export type CreateOrganizationPersonKafkaMessageType = {
  clientPersonaId?: number;
  organizationId?: number;
  data: CreatePersonDto[];
};

// export type CreateOrganizationPersonKafkaMessageReplyType =
//   OrganizationPersonEntity;

export type CreateOrganizationPersonKafkaMessageReplyType = {
  data: OrganizationPersonEntity;
  token: string;
};

export type CreateApplicationPersonKafkaMessageType = {
  organizationId: number;
  applicationId: number;
  applicationPersonType: ApplicationPersonTypeEnum;
  organizationPersons: OrganizationPersonEntity[];
};

// ----------------------- SQF -----------------------

export type RequestKycReportMessage = {
  eventId: string;
  organizationId: number;
  kycReportType: KycReportTypeEnum;
  consent: {
    mobileNumber?: string;
    emailAddress?: string;
    granted: boolean;
  };
};
export type ReceiveKycReportMessage = KycAgencyReport & { eventId: string };

