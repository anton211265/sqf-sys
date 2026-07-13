import { apiClient } from 'utils/reactQuery';

const KG = '/knowledge-graph/api';

export interface ISavedOpportunityQuery {
  name: string;
  title: string;
  description: string;
  parameters: Record<string, number>;
}

export interface IOpportunityResult {
  name: string;
  title: string;
  parameters: Record<string, number>;
  count: number;
  results: Record<string, unknown>[];
}

export interface INaturalLanguageResult {
  question: string;
  cypher: string;
  count: number;
  results: Record<string, unknown>[];
  summary: string;
}

export const getSavedOpportunityQueries = () =>
  apiClient
    .get<ISavedOpportunityQuery[]>(`${KG}/opportunities`)
    .then((r) => r.data);

export const runOpportunityQuery = (
  name: string,
  parameters?: Record<string, number>,
) =>
  apiClient
    .get<IOpportunityResult>(`${KG}/opportunities/${name}`, {
      params: parameters ?? {},
    })
    .then((r) => r.data);

export const askOpportunityQuestion = (question: string) =>
  apiClient
    .post<INaturalLanguageResult>(`${KG}/opportunities/query`, { question })
    .then((r) => r.data);
