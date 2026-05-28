import { CreatePersonDto } from 'apps/trade-directory/src/sqf/person/dto/create-person.dto';
import { ExperianReportTypeEnum } from '../enums/experian-report-type.enum';
import { Experian } from './experian.type';
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

// ----------------------- LCM -----------------------

export type CreateOrganizationMessage = {
  data: UpdatableOrganization;
  persona: {
    isClient: boolean;
    isContractAwarder: boolean;
    isSupplier: boolean;
    isFactor: boolean;
  };
};
export type CreateOrganizationMessageReply = Organization;
export type UpdateOrganizationMessage = {
  id: number;
  data: UpdatableOrganization;
};
export type UpdateOrganizationByClientPersonaIdMessage = {
  clientPersonaId: number;
  data: UpdatableOrganization;
};
export type UpdateOrganizationByContractAwarderPersonaIdMessage = {
  contractAwarderPersonaId: number;
  data: UpdatableOrganization;
};
export type UpdateOrganizationBySupplierPersonaIdMessage = {
  supplierPersonaId: number;
  data: UpdatableOrganization;
};
export type UpdateOrganizationByFactorPersonaIdMessage = {
  factorPersonaId: number;
  data: UpdatableOrganization;
};
export type UpdateOrganizationMessageReply = Organization;

export type RequestExperianReportMessage = {
  organizationId: number;
  experianReportType: ExperianReportTypeEnum;
  consent: {
    mobileNumber?: string;
    emailAddress?: string;
    granted: boolean;
  };
};
export type ReceiveExperianReportMessage = Experian;

// ----------------------- LCM -----------------------
