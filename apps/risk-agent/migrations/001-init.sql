-- Manual DDL migration (POSTGRES_SYNCHRONIZE=false). Run against the
-- "risk-agent" database, e.g.:
--   docker compose exec -T postgres psql -U postgres -d "risk-agent" -f apps/risk-agent/migrations/001-init.sql

CREATE TYPE "OutboxEventStatusEnum" AS ENUM ('pending', 'sent', 'failed');
CREATE TABLE IF NOT EXISTS outbox_event (
  id UUID PRIMARY KEY,
  topic VARCHAR NOT NULL,
  payload JSONB NOT NULL,
  status "OutboxEventStatusEnum" NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  sent_at TIMESTAMP WITHOUT TIME ZONE NULL
);
CREATE INDEX IF NOT EXISTS idx_outbox_event_status ON outbox_event(status);

CREATE TABLE IF NOT EXISTS processed_event (
  id UUID PRIMARY KEY,
  topic VARCHAR NOT NULL,
  processed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);

CREATE TYPE "RiskAgentQueueStatusEnum" AS ENUM (
  'NEW', 'FILTER_SELECTED', 'AWAITING_DOCUMENTS', 'FILTER_1_RECOMMENDED',
  'FILTER_1_CONFIRMED', 'FILTER_2_RECOMMENDED', 'FILTER_2_CONFIRMED', 'CLOSED'
);
CREATE TABLE IF NOT EXISTS risk_agent_queue_item (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  application_number VARCHAR NOT NULL,
  status "RiskAgentQueueStatusEnum" NOT NULL DEFAULT 'NEW',
  selected_risk_model_number VARCHAR NULL,
  selected_risk_profile_code VARCHAR NULL,
  filter_selection_reasoning TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_agent_queue_item_application_number ON risk_agent_queue_item(application_number);

CREATE TYPE "RiskAgentFilterStageEnum" AS ENUM ('FILTER_1', 'FILTER_2');
CREATE TYPE "RiskAgentDecisionEnum" AS ENUM ('APPROVE', 'REJECT', 'ESCALATE');
CREATE TYPE "RiskAgentHumanOutcomeEnum" AS ENUM ('PENDING', 'CONFIRMED', 'OVERRIDDEN');
CREATE TABLE IF NOT EXISTS risk_agent_recommendation (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  application_number VARCHAR NOT NULL,
  filter_stage "RiskAgentFilterStageEnum" NOT NULL,
  decision "RiskAgentDecisionEnum" NOT NULL,
  confidence NUMERIC NOT NULL,
  reasoning JSONB NOT NULL,
  escalate BOOLEAN NOT NULL DEFAULT FALSE,
  human_outcome "RiskAgentHumanOutcomeEnum" NOT NULL DEFAULT 'PENDING',
  human_actor_id INTEGER NULL,
  human_note TEXT NULL,
  resolved_at TIMESTAMP WITHOUT TIME ZONE NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_risk_agent_recommendation_application_number ON risk_agent_recommendation(application_number);

CREATE TYPE "DocumentRequestStatusEnum" AS ENUM ('PENDING', 'RECEIVED', 'OVERDUE', 'ESCALATED');
CREATE TABLE IF NOT EXISTS document_request (
  id SERIAL PRIMARY KEY,
  application_id INTEGER NOT NULL,
  application_number VARCHAR NOT NULL,
  document_types JSONB NOT NULL,
  status "DocumentRequestStatusEnum" NOT NULL DEFAULT 'PENDING',
  sla_days INTEGER NOT NULL,
  due_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  escalated_at TIMESTAMP WITHOUT TIME ZONE NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_document_request_status_due_at ON document_request(status, due_at);
