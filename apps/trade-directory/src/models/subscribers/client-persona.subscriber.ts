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
    // Use event.manager directly (not event.manager.connection.getRepository,
    // which runs on a separate, non-transactional connection and can't see
    // this row if the insert happened inside an open transaction).
    const clientPersonaId = `CL${String(event.entity.id).padStart(6, '0')}`;
    await event.manager.update(
      ClientPersona,
      { id: event.entity.id },
      { clientPersonaId: clientPersonaId },
    );
  }
}
