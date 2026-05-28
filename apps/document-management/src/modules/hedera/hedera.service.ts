import { Injectable } from '@nestjs/common';
import { OnchainAttributes } from '../../models/onchain.entity';
import { IHederaService } from './hedera.interface';
import {
  Client,
  PrivateKey,
  Status,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TransactionReceipt,
} from '@hashgraph/sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HederaService implements IHederaService {
  private hederaClient: Client;
  private hashScanUrl: string;

  constructor(private readonly configService: ConfigService) {
    const env = this.configService.getOrThrow('NODE_ENV');
    const accountId = this.configService.getOrThrow('HEDERA_ACCOUNT_ID');
    const privateKey = this.configService.getOrThrow('HEDERA_PRIVATE_KEY');

    switch (env) {
      case 'development':
      case 'uat':
        this.hederaClient = Client.forTestnet();
        this.hashScanUrl = `https://hashscan.io/testnet/transaction`;
        break;
      case 'production':
        this.hederaClient = Client.forMainnet();
        this.hashScanUrl = `https://hashscan.io/mainnet/transaction`;
        break;
      default:
        throw new Error(`Unsupported environment: ${env}`);
    }

    this.hederaClient.setOperator(
      accountId,
      PrivateKey.fromStringED25519(privateKey),
    );
  }

  async createTopic(): Promise<{
    topicId: string;
    receipt: TransactionReceipt;
  }> {
    const transaction = await new TopicCreateTransaction().execute(
      this.hederaClient,
    );

    const receipt = await transaction.getReceipt(this.hederaClient);

    if (receipt?.status !== Status.Success) {
      throw new Error(
        `Create hedera topic status is ${receipt?.status} with the following receipt: ${receipt}`,
      );
    }

    const topicId = receipt.topicId?.toString();

    return { topicId, receipt };
  }

  async createMessage(
    refId: string,
    eventName: string,
    topicId: string,
    attributes: OnchainAttributes[],
  ): Promise<{
    transactionId: string;
    url: string;
    receipt: TransactionReceipt;
  }> {
    const message = {
      refId,
      eventName,
      attributes,
    };

    const submitTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(message))
      .execute(this.hederaClient);

    const receipt = await submitTx.getReceipt(this.hederaClient);

    if (receipt?.status !== Status.Success) {
      throw new Error(
        `Create hedera message status is ${receipt?.status} with the following receipt: ${receipt}`,
      );
    }

    const transactionId = submitTx.transactionId?.toString();
    const url = `${this.hashScanUrl}/${transactionId}`;

    return { transactionId, receipt, url };
  }
}
