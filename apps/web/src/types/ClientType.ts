interface PersonType {
  id: string;
  name: string;
  preferredUsername: string;
  identificationNumber: string | null;
  mobileNumber: string | null;
  email: string;
}

export interface ClientType {
  clientPersonaId: string;
  clientOrganizationName: string;
  assigneePersonId: string;
  assigneePerson: PersonType;
}
