import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Inject,
  Query,
  NotFoundException,
  UseGuards,
  Post,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { ClientKafka, MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateOrganizationKafkaMessageReplyType,
  CreateOrganizationKafkaMessageType,
} from '@app/common/apps/trade-directory/types/kafka-message.type';
import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { ApiQuery } from '@nestjs/swagger';
import { FindOrganizationByIdDto } from './dto/find-organization-by-id-dto';
import { FindAllOrganizationsDto } from './dto/find-all-organization-dto';
import { OrganizationRepository } from '../../repositories/organization.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { CurrentUser } from '@app/common/apps/common/decorator/current-user.decorator';
import { IUserContext } from '@app/common/apps/common/interface/user-context.interface';

@Controller('/api/organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly organizationRepository: OrganizationRepository,
    @Inject(TRADE_SERVICE) private readonly kafkaProducer: ClientKafka, // Injecting Kafka client
  ) {}

  // --------------- Get an organization ---------------
  @Get(':id')
  @ApiQuery({
    name: 'includeApplications',
    required: false,
    type: Boolean,
    description:
      'Include related applications with application persons in the response.',
  })
  @ApiQuery({
    name: 'includeKycAgencyReports',
    required: false,
    type: Boolean,
    description: 'Include KYC agency reports related to the organization.',
  })
  findOrganizationById(
    @Param('id') id: number,
    @Query() findOrganizationByIdBodyDto: FindOrganizationByIdDto,
  ) {
    return this.organizationService.findOrganizationById(
      +id,
      findOrganizationByIdBodyDto,
    );
  }

  // --------------- Get all organization ---------------
  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 15)',
  })
  findAllOrganization(
    @Query() findAllOrganizationsDto: FindAllOrganizationsDto,
  ) {
    return this.organizationService.findAllOrganization(
      findAllOrganizationsDto.page,
      findAllOrganizationsDto.pageSize,
    );
  }

  // --------------- Get an organization by clientPersonaId ---------------
  @Get('/by-client-persona-id/:clientPersonaId')
  findOrganizationByClientPersonaId(
    @Param('clientPersonaId') clientPersonaId: number,
  ) {
    return this.organizationService.findOrganizationByClientPersonaId(
      +clientPersonaId,
    );
  }

  // --------------- Update organization details ---------------

  // Request body example
  // {
  //   "organizationType": "PRIVATE_LIMITED",
  //   "country": "UA",
  //   "businessSector": "SERVICES",
  //   "emailAddress": "info@techinnovators.com.my",
  //   "contactNumber": "+6587654321",
  //   "organizationWebsite": "https://www.techinnovators.com",
  //   "registeredAddress": "123 Innovation Blvd, Suite 100",
  //   "postcode": "10001",
  //   "companySize": "251-500",
  //   "yearEstablished": "2024",
  //   "revenueCurrency": "USD",
  //   "revenueAmount": 2345.78,
  //   "taxIdentificationNumber": "AA 12345678912"
  // }
  @Patch(':id')
  updateOrganizationById(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.updateOrganizationById(
      +id,
      updateOrganizationDto,
    );
  }

  // --------------- Kafka Consumer ---------------
  @MessagePattern(KafkaTopicEnum.SQF_CREATE_ORGANIZATION)
  async handleCreateNewOrganization(
    message: CreateOrganizationKafkaMessageType, // The organization data from Kafka Producer
  ): Promise<CreateOrganizationKafkaMessageReplyType> {
    // Log to ensure we receive the message correctly

    // Process the message by creating the organization in services and store to database
    const reply =
      await this.organizationService.handleCreateNewOrganization(message);

    // Log reply message

    // Send the response back to Kafka
    return reply;
  }

  @MessagePattern(KafkaTopicEnum.SQF_GET_ORGANIZATION_BY_ID)
  async handleGetOrganizationById(organizationId: number) {

    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    return organization;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/fully-onboarded')
  updateOnBoardingAt(@CurrentUser() user: IUserContext) {
    return this.organizationService.updateOnBoardingAt(user.orgId);
  }
}
