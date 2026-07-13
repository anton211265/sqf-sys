import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { AppActions, OrganizationPersonRoleEnum } from '../constants/enum';
import { OrganizationPersonRole, UserType } from '../types/UserType';

export default function defineAbilityFor(user: UserType) {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  const userRoles = user.organizationPersonRoles.map(
    (opr: OrganizationPersonRole) => opr.role
  );
  const isManagement =
    userRoles.includes(OrganizationPersonRoleEnum.CEO) ||
    userRoles.includes(OrganizationPersonRoleEnum.COO);
  const isCorpComm = userRoles.includes(
    OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS
  );
  const isCustomerSuccess = userRoles.includes(
    OrganizationPersonRoleEnum.CUSTOMER_SUCCESS
  );
  const isClientCoverage = userRoles.includes(
    OrganizationPersonRoleEnum.CLIENT_COVERAGE
  );
  const isSuperuser = userRoles.includes(OrganizationPersonRoleEnum.SUPERUSER);
  const isSqfSys = userRoles.includes(OrganizationPersonRoleEnum.SQFSYS);

  if (isSqfSys) {
    can(AppActions.Manage, 'SystemSetup');
  }

  if (isManagement || isCorpComm || isCustomerSuccess) {
    can(AppActions.Read, 'Application');
    can(AppActions.Read, 'ClientAssignee');
  }

  if (isCorpComm || isCustomerSuccess || isClientCoverage) {
    can(AppActions.Read, 'Application', { assigneePersonId: user.personId });
    can(AppActions.Read, 'ClientAssignee', { assigneePersonId: user.personId });
  }

  if (isCorpComm || isCustomerSuccess || isClientCoverage) {
    can(AppActions.Create, 'Application');
    can(AppActions.Update, 'Application', {
      assigneePersonId: user.personId,
    });
  }

  if (isSuperuser) {
    can(AppActions.Manage, 'all');
  }

  return build();
}
