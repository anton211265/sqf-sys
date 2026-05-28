import { DocumentExtractionStatus } from '../models/document-extraction.entity';
import { OnchainStatus } from '../models/onchain.entity';

export interface DocumentExtractionsQueryType {
  status?: DocumentExtractionStatus;
}

export interface OnchainsQueryType {
  status?: OnchainStatus;
}
