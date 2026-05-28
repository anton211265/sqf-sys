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
    const repo = event.manager.connection.getRepository(SupplierPersona);
    const supplierPersonaId = `SU${String(event.entity.id).padStart(6, '0')}`;
    await repo.update(
      { id: event.entity.id },
      { supplierPersonaId: supplierPersonaId },
    );
  }
}
