-- Risk profile governance (2026-07-24): maker-checker change requests for
-- risk profile weights (blueprint/SQFSYS ruling: changes to the default
-- risk profile must be approved by the Risk Operations Manager and written
-- to a risk audit log). One PENDING request per profile; the maker cannot
-- approve their own change (enforced in-service). Apply manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-24-risk-governance.sql

CREATE TABLE IF NOT EXISTS risk_profile_change_request (
  id SERIAL PRIMARY KEY,
  risk_profile_id integer NOT NULL REFERENCES risk_profile(id) ON DELETE CASCADE,
  risk_profile_code varchar NOT NULL,
  -- [{weightId, parameterName, oldWeight, newWeight}]
  proposed_weights jsonb NOT NULL,
  status varchar NOT NULL DEFAULT 'PENDING',
  requested_by_person_id integer NOT NULL,
  requested_by_org_id integer NOT NULL,
  request_reason varchar(300),
  decided_by_person_id integer,
  decided_at timestamp,
  decision_note varchar(300),
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_rpcr_pending_profile
  ON risk_profile_change_request (risk_profile_id) WHERE status = 'PENDING';

-- Append-only (application-level; INSERT-only DB grant is a Terraform-phase
-- item, same as rbac_audit_log / auth_audit_log).
CREATE TABLE IF NOT EXISTS risk_audit_log (
  id SERIAL PRIMARY KEY,
  event varchar NOT NULL,
  risk_profile_code varchar,
  actor_person_id integer NOT NULL,
  payload jsonb,
  created_at timestamp NOT NULL DEFAULT LOCALTIMESTAMP
);
