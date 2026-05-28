import { PersonProtoConverter } from '@app/common/apps/trade-directory/proto-converter';
import { Person } from '@app/common/apps/trade-directory/proto/entity';
import {
  CreatePersonDto,
  GetAllPersonDto,
  PersonByIdDto,
  PersonGrpcServiceController,
  PersonGrpcServiceControllerMethods,
  PersonList,
  UpdatePersonDto,
} from '@app/common/apps/trade-directory/proto/person';
import { Controller } from '@nestjs/common';
import { PersonService } from './person.service';

@Controller('person')
@PersonGrpcServiceControllerMethods()
export class PersonController implements PersonGrpcServiceController {
  constructor(private readonly personService: PersonService) {}

  async getAllGrpc(request: GetAllPersonDto): Promise<PersonList> {
    const data = await this.personService.getAll({
      includeOrganizationPerson: request.includeOrganizationPerson,
    });
    const response: PersonList = {
      persons: data.map((person) =>
        PersonProtoConverter.convertToProto(person),
      ),
    };
    return response;
  }

  async findByIdGrpc(request: PersonByIdDto): Promise<PersonList> {
    const data = await this.personService.findById(request.id, {
      includeOrganizationPerson: request.includeOrganizationPerson,
    });
    const response: PersonList = {
      persons: data.map((person) =>
        PersonProtoConverter.convertToProto(person),
      ),
    };
    return response;
  }

  async createGrpc(request: CreatePersonDto): Promise<Person> {
    const data = await this.personService.createPerson(
      PersonProtoConverter.convertToUpdatableApp(request.person),
    );

    return PersonProtoConverter.convertToProto(data);
  }

  async updateGrpc(request: UpdatePersonDto): Promise<Person> {
    const data = await this.personService.updatePerson(
      request.id,
      PersonProtoConverter.convertToUpdatableApp(request.person),
    );
    return PersonProtoConverter.convertToProto(data);
  }
}
