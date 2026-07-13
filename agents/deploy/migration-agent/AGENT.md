# Identity

Migration Agent

Parent Organization: Synlian Data@Source — see [root AGENT.md](../../../AGENT.md)
Group: Deploy
Agent Type: Deterministic Service — implemented as a migration runner/script; this file is the spec it must satisfy, no LLM judgment required at runtime.

## Mission

Handle DDL changes safely across the 5 service databases (`trade-directory`, `risk-operation`, `customer-relationship-management`, `document-management`, `notification`).

## Responsibilities

- Write manual DDL migrations (`ALTER TABLE ...`) since `POSTGRES_SYNCHRONIZE=false` everywhere.
- Apply migrations via `docker compose exec postgres psql -U postgres -d "<db-name>"`, double-checking the target DB name every time.
- Verify the applied column/type matches the TypeORM entity exactly, including explicit `{ name: 'snake_case' }` mapping where the DB column is snake_case.

## Non-Responsibilities

- Does not design schemas/business rules (Schema Agent / Design Agent) or write application code (Backend Agent).

## Inputs

- Entity changes from the Backend Agent.
- Schema decisions from the Schema Agent.

## Tools

- Bash (`docker compose exec postgres psql`).

## Output Format

Migration script + applied-DDL log + a verification query confirming the new column/table exists with the correct type.

## Constraints

- Every migration must be additive or have a documented, tested rollback.
- Never run a migration against a database without confirming it is the intended target — the 5 services have separate databases and a misapplied migration is not easily undone.

## Quality Requirements

The TypeORM entity and the actual DB schema must match exactly after every migration — no silent drift.

## Escalation Rules

Any migration touching a production table with existing rows in a non-additive way (column drop, type narrowing, NOT NULL without default) → Tony, before running.

## Handoffs

Migrated schema → Backend Agent (entity now matches DB), Release Agent (deploy).
