import { OrganizationPersonRoleEnum } from '@app/common/apps/trade-directory/enums/organization-person-role.enum';
import { AuthResponseDto } from '@app/common/guards/auth/dtos/auth-response.dto';
import {
  AbilityBuilder,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  createMongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { ClientAssignee } from 'apps/customer-relationship-management/src/models';
import { Application } from 'apps/risk-operation/src/models';
import { OrganizationPersonRole } from 'apps/trade-directory/src/models';

export enum AppActions {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
export type AppSubjects = InferSubjects<
  | typeof OrganizationPersonRole
  | typeof Application
  | typeof ClientAssignee
  | 'all',
  true
>;
export type AppAbility = MongoAbility<[AppActions, AppSubjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthResponseDto) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    const userRoles = user.organizationPersonRoles.map((opr) => opr.role);
    const isManagement =
      userRoles.includes(OrganizationPersonRoleEnum.CEO) ||
      userRoles.includes(OrganizationPersonRoleEnum.COO);
    const isCorpComm = userRoles.includes(
      OrganizationPersonRoleEnum.CORPORATE_COMMUNICATIONS,
    );
    const isCustomerSuccess = userRoles.includes(
      OrganizationPersonRoleEnum.CUSTOMER_SUCCESS,
    );
    const isClientCoverage = userRoles.includes(
      OrganizationPersonRoleEnum.CLIENT_COVERAGE,
    );
    const isSuperuser = userRoles.includes(
      OrganizationPersonRoleEnum.SUPERUSER,
    );

    if (isManagement || isCorpComm || isCustomerSuccess) {
      can(AppActions.Read, Application);
      can(AppActions.Read, ClientAssignee);
    }

    if (isCorpComm || isCustomerSuccess || isClientCoverage) {
      can(AppActions.Read, Application, { assigneePersonId: user.personId });
      can(AppActions.Read, ClientAssignee, { assigneePersonId: user.personId });
    }

    if (isCorpComm || isCustomerSuccess || isClientCoverage) {
      can(AppActions.Create, Application);
      can(AppActions.Update, Application, {
        assigneePersonId: user.personId,
      });
    }

    if (isSuperuser) {
      can(AppActions.Manage, 'all');
    }

    return build({
      detectSubjectType: (item) =>
        item.constructor as ExtractSubjectType<AppSubjects>,
    });
  }
}
