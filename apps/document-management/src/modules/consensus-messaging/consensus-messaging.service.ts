import {
  BadRequestException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IConsensusMessagingService } from './consensus-messaging.interface';
import { HEDERA_SERVICE, IHederaService } from '../hedera/hedera.interface';
import { OnchainRepository } from '../../repositories/onchain.repository';
import {
  OnchainAttributes,
  Onchain,
  OnchainStatus,
  OnchainInternalType,
} from '../../models/onchain.entity';
import { v4 as uuidv4 } from 'uuid';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';
import { OnchainResponseDto } from './dto/response/onchains-response.dto';
import { OnchainsQueryType } from '../../interface/query.interface';

@Injectable()
export class ConsensusMessagingService implements IConsensusMessagingService {
  constructor(
    @Inject(HEDERA_SERVICE) private readonly hederaService: IHederaService,
    private readonly onchainRepository: OnchainRepository,
  ) {}

  async createTopicWithMessage(
    orgId: string,
    refId: string,
    eventName: string,
    attributes: OnchainAttributes[],
    isInternal: boolean,
  ): Promise<RequestIdResponseDto> {
    const { topicId } = await this.hederaService.createTopic();
    const { transactionId, url } = await this.hederaService.createMessage(
      refId,
      eventName,
      topicId,
      attributes,
    );

    const requestId = uuidv4();

    const newOnchain = new Onchain({
      requestId,
      orgId,
      refId,
      topicId,
      eventName,
      transactionId,
      status: OnchainStatus.PENDING_WEBHOOK,
      isInternal,
      url,
    });

    await this.onchainRepository.save(newOnchain);

    return { requestId };
  }

  async createMessage(
    topicId: string,
    orgId: string,
    refId: string,
    eventName: string,
    attributes: OnchainAttributes[],
    isInternal: boolean,
  ): Promise<RequestIdResponseDto> {
    const existingTopic = await this.onchainRepository.findOne({
      where: { topicId },
    });

    if (!existingTopic) {
      throw new BadRequestException(
        `No topic exists with the following Id: ${topicId}`,
      );
    }

    const { transactionId, url } = await this.hederaService.createMessage(
      refId,
      eventName,
      topicId,
      attributes,
    );

    const requestId = uuidv4();

    const newOnchain = new Onchain({
      requestId,
      orgId,
      refId,
      topicId,
      eventName,
      transactionId,
      status: OnchainStatus.PENDING_WEBHOOK,
      isInternal,
      url,
    });

    await this.onchainRepository.save(newOnchain);

    return { requestId };
  }

  async handleInternalTopicMessageCompletion(data: Onchain): Promise<void> {
    const { eventName } = data;

    switch (eventName) {
      case OnchainInternalType.TEST:
        // Handle based on type

        break;
      default:
        throw new UnprocessableEntityException(
          `Unhandled internal onchain event name: ${eventName}`,
        );
    }
  }

  async onchains(
    orgId: string,
    status?: OnchainStatus,
  ): Promise<OnchainResponseDto[]> {
    const query: OnchainsQueryType = {};

    if (status) {
      query.status = status;
    }

    const onchains = await this.onchainRepository.find({
      where: { orgId, ...query },
      select: [
        'requestId',
        'refId',
        'status',
        'topicId',
        'transactionId',
        'url',
        'eventName',
        'error',
        'createdAt',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    const response: OnchainResponseDto[] = onchains.map((r) => ({
      requestId: r.requestId,
      refId: r.refId,
      status: r.status,
      topicId: r.topicId,
      transactionId: r.transactionId,
      url: r.url,
      eventName: r.eventName,
      error: r.error ?? null,
      createdAt: r.createdAt,
    }));

    return response;
  }

  async onchain(orgId: string, requestId: string): Promise<OnchainResponseDto> {
    const onchain = await this.onchainRepository.findOne({
      where: { requestId, orgId },
      select: [
        'requestId',
        'refId',
        'status',
        'topicId',
        'transactionId',
        'url',
        'eventName',
        'error',
        'createdAt',
      ],
    });

    if (!onchain) {
      throw new BadRequestException(
        `No consensus message found with the following requestId: ${requestId}`,
      );
    }

    const response: OnchainResponseDto = {
      requestId: onchain.requestId,
      refId: onchain.refId,
      status: onchain.status,
      topicId: onchain.topicId,
      transactionId: onchain.transactionId,
      url: onchain.url,
      eventName: onchain.eventName,
      error: onchain.error ?? null,
      createdAt: onchain.createdAt,
    };

    return response;
  }
}
