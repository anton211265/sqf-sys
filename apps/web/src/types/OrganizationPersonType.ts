export interface OrganizationPerson {
  id: number;
  designation: string;
  sub: any; // You can provide the type for this property if needed
  createdAt: string;
  updatedAt: string;
  person: {
    id: number;
    name: string | null;
    preferredUsername: string | null;
    residentialAddress: string | null;
    identificationNumber: string | null;
    mobileNumber: string | null;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
}
