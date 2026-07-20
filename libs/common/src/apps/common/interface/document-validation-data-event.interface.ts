// Payload of KafkaTopicEnum.DOCUMENT_VALIDATION_DATA — trade-directory's
// stored snapshot of the organization a COMPANY_REGISTRY document claims to
// describe. document-management compares this against the extracted fields.
export interface DocumentValidationDataEvent {
  eventId: string;
  documentUuid: string;
  subjectOrganizationId: number;
  organizationFound: boolean;
  storedOrganization?: {
    organizationName: string;
    businessRegistrationNumber?: string | null;
    registeredAddress?: string | null;
    businessAddress?: string | null;
    country?: string | null;
    incorporationDate?: string | null;
  };
  storedDirectorNames?: string[];
}
