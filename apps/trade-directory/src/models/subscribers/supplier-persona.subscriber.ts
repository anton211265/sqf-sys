import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { SupplierPersona } from '../supplier-persona.entity';

// auto generates the supplier persona id with the format SU000001
@EventSubscriber()
export class SupplierPersonaSubscriber
  implements EntitySubscriberInterface<SupplierPersona>
{
  listenTo() {
    return SupplierPersona;
  }

  async afterInsert(event: InsertEvent<SupplierPersona>) {
    // Use event.manager directly (not event.manager.connection.getRepository,
    // which runs on a separate, non-transactional connection and can't see
    // this row if the insert happened inside an open transaction).
    const supplierPersonaId = `SU${String(event.entity.id).padStart(6, '0')}`;
    await event.manager.update(
      SupplierPersona,
      { id: event.entity.id },
      { supplierPersonaId: supplierPersonaId },
    );
  }
}
