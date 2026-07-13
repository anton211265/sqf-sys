export interface OrganizationPersonRole {
  role: string;
}

// Update UserType to reflect the change
export interface UserType {
  personId: string;
  name: string;
  preferredUsername: string;
  identificationNumber: string | null;
  mobileNumber: string | null;
  email: string;
  sub: string;
  organizationPersonId: string;
  organizationPersonRoles: { role: string }[];
  organizationId: string;
  funderPersonaId: string;
}

export interface UserRoleType {
  personId: string;
  name: string;
  email: string;
  organizationPersonId: number;
  organizationPersonRoles: string[];
}
