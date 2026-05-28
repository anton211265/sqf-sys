import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { ContractAwarderPersona } from '../contract-awarder-persona.entity';

// auto generates the contract awarder persona id with the format AW000001
@EventSubscriber()
export class ContractAwarderPersonaSubscriber
  implements EntitySubscriberInterface<ContractAwarderPersona>
{
  listenTo() {
    return ContractAwarderPersona;
  }

  async afterInsert(event: InsertEvent<ContractAwarderPersona>) {
    const repo = event.manager.connection.getRepository(ContractAwarderPersona);
    const contractAwarderPersonaId = `AW${String(event.entity.id).padStart(
      6,
      '0',
    )}`;
    await repo.update(
      { id: event.entity.id },
      { contractAwarderPersonaId: contractAwarderPersonaId },
    );
  }
}
