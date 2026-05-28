import { TransactionReceipt } from '@hashgraph/sdk';
import { OnchainAttributes } from '../../models/onchain.entity';

export const HEDERA_SERVICE = 'HEDERA_SERVICE';

export interface IHederaService {
  /**
   * create topic on the blockchain
   */
  createTopic(): Promise<{
    topicId: string;
    receipt: TransactionReceipt;
  }>;

  /**
   * add message to an existing topic on the blockchain
   * @param refId - The refId defined by the user
   * @param eventName - The event name defined by the user
   * @param topicId - The existing topicId on the blockchain
   * @param attributes - The main data of the message
   */
  createMessage(
    refId: string,
    eventName: string,
    topicId: string,
    attributes: OnchainAttributes[],
  ): Promise<{
    transactionId: string;
    url: string;
    receipt: TransactionReceipt;
  }>;
}
