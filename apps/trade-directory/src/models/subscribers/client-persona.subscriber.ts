import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { ClientPersona } from '../client-persona.entity';

// auto generates the client persona id with the format CL000001
@EventSubscriber()
export class ClientPersonaSubscriber
  implements EntitySubscriberInterface<ClientPersona>
{
  listenTo() {
    return ClientPersona;
  }

  async afterInsert(event: InsertEvent<ClientPersona>) {
    const repo = event.manager.connection.getRepository(ClientPersona);
    const clientPersonaId = `CL${String(event.entity.id).padStart(6, '0')}`;
    await repo.update(
      { id: event.entity.id },
      { clientPersonaId: clientPersonaId },
    );
  }
}
