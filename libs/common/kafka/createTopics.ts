import { KafkaTopicEnum } from '@app/common/constants/kafka-topic.enum';
import { TRADE_SERVICE } from '@app/common/constants/services';
import { Kafka } from 'kafkajs';

export default async (brokers: string[], ssl: boolean): Promise<void> => {
  const kafka = new Kafka({
    clientId: TRADE_SERVICE,
    ssl,
    brokers,
  });
  const admin = kafka.admin();
  const topics = await admin.listTopics();
  console.log('creating kafka topics =>', topics);

  const topicList = [];

  if (!topics.includes(KafkaTopicEnum.REQUEST_KYC_REPORT)) {
    topicList.push({
      topic: KafkaTopicEnum.REQUEST_KYC_REPORT,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.RECEIVE_KYC_REPORT)) {
    topicList.push({
      topic: KafkaTopicEnum.RECEIVE_KYC_REPORT,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.RELATIONSHIP_UPSERTED)) {
    topicList.push({
      topic: KafkaTopicEnum.RELATIONSHIP_UPSERTED,
      numPartitions: 2,
      replicationFactor: 1,
    });
  }

  if (!topics.includes(KafkaTopicEnum.CONTRACT_UPSERTED)) {
    topicList.push({
      topic: KafkaTopicEnum.CONTRACT_UPSERTED,
      numPartitions: 2,
      replicationFactor: 1,
    });
  }

  if (!topics.includes(KafkaTopicEnum.INVOICE_STATUS_CHANGED)) {
    topicList.push({
      topic: KafkaTopicEnum.INVOICE_STATUS_CHANGED,
      numPartitions: 2,
      replicationFactor: 1,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SEND_EMAIL)) {
    topicList.push({
      topic: KafkaTopicEnum.SEND_EMAIL,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.CREATE_CLIENT_ASSIGNEE)) {
    topicList.push({
      topic: KafkaTopicEnum.CREATE_CLIENT_ASSIGNEE,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_CREATE_ORGANIZATION)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_CREATE_ORGANIZATION,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_CREATE_ORGANIZATION_PERSON,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_GET_ALL_APPLICATIONS)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_GET_ALL_APPLICATIONS,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_GET_ORGANIZATION_PERSON_BY_ID)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_GET_ORGANIZATION_PERSON_BY_ID,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_GET_APPLICATIONS_BY_ORG_ID)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_GET_APPLICATIONS_BY_ORG_ID,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.SQF_GET_ORGANIZATION_BY_ID)) {
    topicList.push({
      topic: KafkaTopicEnum.SQF_GET_ORGANIZATION_BY_ID,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.AUTHENTICATE)) {
    topicList.push({
      topic: KafkaTopicEnum.AUTHENTICATE,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (!topics.includes(KafkaTopicEnum.AUTHENTICATE_REPLY)) {
    topicList.push({
      topic: KafkaTopicEnum.AUTHENTICATE_REPLY,
      numPartitions: 2,
      replicationFactor: 3,
    });
  }

  if (topicList.length) {
    try {
      await admin.createTopics({
        topics: topicList,
      });
    } catch (e) {
      console.warn('Kafka topic creation warning (non-fatal):', e.message);
    }
  }
  await admin.disconnect();
};
