export interface UserType {
  personId: string;
  name: string;
  email: string;
  organizationPersonId: string;
  organizationPersonRoles: { role: string }[];
  organizationId: string;
  funderPersonaId: string;
  fullyOnboardedAt: string | null;
}
