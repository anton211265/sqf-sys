import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateApplicationPersonKafkaMessageType } from '@app/common/apps/trade-directory/types/kafka-message.type';
import { OrganizationRepository } from 'apps/trade-directory/src/repositories';
import { ApplicationPersonRepository } from '../../repositories/application-person.repository';
import { ApplicationPerson } from '../../models/application-person.entity';
import { ApplicationRepository } from '../../repositories/application.repository';
import { CreateApplicationPersonDto } from './dto/create-application-person.dto';

@Injectable()
export class ApplicationPersonService {
  constructor(
    private readonly applicationPersonRepository: ApplicationPersonRepository,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  

  async createNewApplicationPerson(
    createApplicationPersonDto: CreateApplicationPersonDto,
  ) {
    const {
      organizationId,
      applicationId,
      applicationPersonType,
      organizationPersons,
    } = createApplicationPersonDto;

    try {
      // Fetch the Application entity
      const application = await this.applicationRepository.findOne({
        where: { id: applicationId },
      });

      if (!application) {
        throw new Error(
          `Error in createNewApplicationPerson(): Application with ID ${applicationId} not found.`,
        );
      }

      const savedApplicationPersons = await Promise.all(
        organizationPersons.map(async (orgPerson) => {
          // Create a new ApplicationPerson entity and assign relationships
          const applicationPersonEntity = new ApplicationPerson({
            application: application, // Use the application entity
            organizationPersonId: orgPerson.id,
            applicationPersonType: applicationPersonType,
          });

          // Save the entity
          return await this.applicationPersonRepository.save(
            applicationPersonEntity,
          );
        }),
      );
    } catch (error) {
      // Handle unexpected errors
      console.error('Error fetching organization:', error);

      // Re-throw the HttpException to preserve its status and message
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: `Failed to save application person for applicationId: ${applicationId}`,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  // async handleCreateNewApplicationPerson(
  //   message: CreateApplicationPersonKafkaMessageType,
  // ): Promise<void> {
  //   try {
  //     // Fetch the Application entity
  //     const application = await this.applicationRepository.findOne({
  //       where: { id: message.applicationId },
  //     });

  //     if (!application) {
  //       throw new Error(
  //         `Error in handleCreateNewApplicationPerson(): Application with ID ${message.applicationId} not found.`,
  //       );
  //     }

  //     const savedApplicationPersons = await Promise.all(
  //       message.organizationPersons.map(async (orgPerson) => {
  //         // Create a new ApplicationPerson entity and assign relationships
  //         const applicationPersonEntity = new ApplicationPerson({
  //           application: application, // Use the application entity
  //           organizationPersonId: orgPerson.id,
  //           applicationPersonType: message.applicationPersonType,
  //         });

  //         // Save the entity
  //         return await this.applicationPersonRepository.save(
  //           applicationPersonEntity,
  //         );
  //       }),
  //     );

  //
  //   } catch (error) {
  //     console.error(
  //       'Error processing SQF_CREATE_APPLICATION_PERSON Kafka:',
  //       error,
  //     );
  //     throw error;
  //   }
  // }
}
