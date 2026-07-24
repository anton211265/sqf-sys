export interface UserType {
  personId: string;
  name: string;
  email: string;
  organizationPersonId: string;
  organizationPersonRoles: { role: string }[];
  organizationId: string;
  funderPersonaId: string;
  fullyOnboardedAt: string | null;
  /** Signed-in org id, merged in at login — the wizard's
   * subjectOrganizationId for document uploads. */
  orgId?: number;
}
