import { OrganizationPersonRoleEnum } from './enum';

export const roles = [
  { name: 'SQF System', code: OrganizationPersonRoleEnum.SQFSYS },
  { name: 'Super User', code: OrganizationPersonRoleEnum.SUPERUSER },
  { name: 'CEO', code: OrganizationPersonRoleEnum.CEO },
  { name: 'COO', code: OrganizationPersonRoleEnum.COO },
  { name: 'Client Coverage', code: OrganizationPersonRoleEnum.CLIENT_COVERAGE },
  {
    name: 'Customer Success',
    code: OrganizationPersonRoleEnum.CUSTOMER_SUCCESS,
  },
  {
    name: 'Corporate Communications',
    code: OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS,
  },
];
