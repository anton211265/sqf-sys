import { Controller, Get, Inject, Param } from '@nestjs/common';
import { OrganizationPersonService } from './organization-person.service';
import {
  ClientKafka,
  EventPattern,
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { TRADE_SERVICE } from '@app/common/constants/services';
import {
  CreateOrganizationPersonKafkaMessageReplyType,
  CreateOrganizationPersonKafkaMessageType,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { plainToInstance } from 'class-transformer';
import { CreatePersonDto } from '../person/dto/create-person.dto';

@Controller('/api/organization-persons')
export class OrganizationPersonController {
  constructor(
    private readonly organizationPersonService: OrganizationPersonService,
    @Inject(TRADE_SERVICE) private readonly kafkaProducer: ClientKafka, // Injecting Kafka client
  ) {}

  // --------------- Kafka Consumer ---------------
  // 1. This is an event-driven workflow where the producer sends a message to Kafka without expecting a response.
  // 2. @EventPattern is designed for fire-and-forget messaging, making it ideal for asynchronous, decoupled communication between services.
  // 3. Unlike @MessagePattern (which is for request-response workflows), @EventPattern simply processes incoming events without requiring a reply.

  /**
   * Kafka Consumer: Handles events from the SQF_CREATE_ORGANIZATION_PERSON topic.
   * - Receives organization person data.
   * - Transforms plain data into DTO instances for validation and processing.
   * @param message - Kafka message containing clientPersonaId and an array of person data.
   */
  @MessagePattern(KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON)
  async handleCreateNewOrganizationPerson(
    message: CreateOrganizationPersonKafkaMessageType,
  ): Promise<CreateOrganizationPersonKafkaMessageReplyType[]> {

    /**
     * Apply transformations using plainToInstance:
     * - Ensures that the plain data received from Kafka is converted into class instances.
     * - Applies all `@Transform` decorators defined in the DTO, such as converting `name` to uppercase.
     * - Maps the `data` array into instances of `CreatePersonDto`.
     */
    const transformedData = message.data.map((person) =>
      plainToInstance(CreatePersonDto, person),
    );

    /**
     * Pass the transformed data to the service:
     * - The `data` array now contains properly transformed and validated DTO instances.
     * - This ensures all fields (e.g., name, residentialAddress, designation) are processed as expected.
     */
    const result =
      await this.organizationPersonService.handleCreateNewOrganizationPerson({
        ...message,
        data: transformedData, // Use the transformed data
      });

    // Return the reply as expected
    return result;
  }

  // --------------- Get Organization Persons by Organization Id ---------------
  @MessagePattern(KafkaTopicEnum.SQF_GET_ORGANIZATION_PERSON_BY_ID)
  async getOrganizationPersonByOrganizationId(@Payload() organizationId: number) {

    const organizationPersonbyId = await this.organizationPersonService.findOrganizationPersonByOrganizationIdEvent(
      organizationId,
    );

    return organizationPersonbyId;
  }
}
