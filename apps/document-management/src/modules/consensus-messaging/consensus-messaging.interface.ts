import {
  Onchain,
  OnchainAttributes,
  OnchainStatus,
} from '../../models/onchain.entity';
import { OnchainResponseDto } from './dto/response/onchains-response.dto';
import { RequestIdResponseDto } from './dto/response/request-id-response.dto';

export const CONSENSUS_MESSAGING_SERVICE = 'CONSENSUS MESSAGING SERVICE';

export interface IConsensusMessagingService {
  /**
   * Create topic and initial message onchain
   * @param orgId
   * @param refId
   * @param eventName
   * @param attributes
   * @param isInternal
   */
  createTopicWithMessage(
    orgId: string,
    refId: string,
    eventName: string,
    attributes: OnchainAttributes[],
    isInternal: boolean,
  ): Promise<RequestIdResponseDto>;

  /**
   * Create message for an existing topic
   * @param topicId
   * @param orgId
   * @param refId
   * @param eventName
   * @param attributes
   * @param isInternal
   */
  createMessage(
    topicId: string,
    orgId: string,
    refId: string,
    eventName: string,
    attributes: OnchainAttributes[],
    isInternal: boolean,
  ): Promise<RequestIdResponseDto>;

  /**
   * handle internal consensus messaging operation
   * @param data
   */
  handleInternalTopicMessageCompletion(data: Onchain): Promise<void>;

  /**
   * Fetch all consensus messages
   * @param orgId - The organization id
   * @param status - The status of consensus messages
   */
  onchains(
    orgId: string,
    status?: OnchainStatus,
  ): Promise<OnchainResponseDto[]>;

  /**
   * Fetch a consensus message based on requestId
   * @param orgId - The organization id
   * @param requestId - The requestId
   */
  onchain(orgId: string, requestId: string): Promise<OnchainResponseDto>;
}
