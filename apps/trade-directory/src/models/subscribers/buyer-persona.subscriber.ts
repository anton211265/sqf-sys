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
    const repo = event.manager.connection.getRepository(BuyerPersona);
    const buyerPersonaId = `BY${String(event.entity.id).padStart(
      6,
      '0',
    )}`;
    await repo.update(
      { id: event.entity.id },
      { buyerPersonaId: buyerPersonaId },
    );
  }
}
