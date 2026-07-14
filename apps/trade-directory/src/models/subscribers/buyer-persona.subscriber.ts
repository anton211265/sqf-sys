import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { BuyerPersona } from '../buyer-persona.entity';

// auto generates the buyer persona id with the format BY000001
@EventSubscriber()
export class BuyerPersonaSubscriber
  implements EntitySubscriberInterface<BuyerPersona>
{
  listenTo() {
    return BuyerPersona;
  }

  async afterInsert(event: InsertEvent<BuyerPersona>) {
    // Use event.manager directly (not event.manager.connection.getRepository,
    // which runs on a separate, non-transactional connection and can't see
    // this row if the insert happened inside an open transaction).
    const buyerPersonaId = `BY${String(event.entity.id).padStart(6, '0')}`;
    await event.manager.update(
      BuyerPersona,
      { id: event.entity.id },
      { buyerPersonaId: buyerPersonaId },
    );
  }
}
