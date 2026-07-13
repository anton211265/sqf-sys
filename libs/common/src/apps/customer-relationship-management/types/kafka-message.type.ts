export type CreateClientAssigneeMessage = {
  eventId: string;
  data: {
    clientPersonaId: number;
    assigneePersonId: number;
  };
};
