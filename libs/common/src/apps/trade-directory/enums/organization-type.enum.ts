export enum OrganizationTypeEnum {
  GOVERNMENT_EP = 'GOVERNMENT_EP',
  GOVERNMENT_NON_EP = 'GOVERNMENT_NON_EP',
  GOVERNMENT_LINKED_COMPANY = 'GOVERNMENT_LINKED_COMPANY',
  MULTINATIONAL_CORPORATION = 'MULTINATIONAL_CORPORATION',
  PUBLIC_LIMITED = 'PUBLIC_LIMITED',
  PRIVATE_LIMITED = 'PRIVATE_LIMITED',
  PARTNERSHIP = 'PARTNERSHIP',
  SOLE_PROPRIETORSHIP = 'SOLE_PROPRIETORSHIP',
  COOPERATIVE = 'COOPERATIVE',
  OTHERS = 'OTHERS',
}

export namespace OrganizationTypeEnumHelper {
  export function CompanyType() {
    return [
      OrganizationTypeEnum.PUBLIC_LIMITED,
      OrganizationTypeEnum.PRIVATE_LIMITED,
    ];
  }

  export function BusinessType() {
    return [
      OrganizationTypeEnum.PARTNERSHIP,
      OrganizationTypeEnum.SOLE_PROPRIETORSHIP,
    ];
  }
}
