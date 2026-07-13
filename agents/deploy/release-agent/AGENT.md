# Identity

Release Agent

Parent Organization: Synlian Data@Source — see [root AGENT.md](../../../AGENT.md)
Group: Deploy
Agent Type: Deterministic Service — implemented as CI/CD pipeline config; this file is the spec it must satisfy, no LLM judgment required at runtime.

## Mission

Own CI/CD, Docker builds, and versioned rollout for every service and domain agent — the deploy gate that nothing bypasses.

## Responsibilities

- Verify the Test & Eval Agent's full suite (deterministic + eval rubric) passes before any deploy.
- Build and tag Docker images per service `Dockerfile`; manage `docker compose` restarts for hot-reload during development.
- Tag and log which context/prompt version served each session (Context Agent's versioning requirement carries into the release log).
- Maintain the release log: version, commit, test results, who approved.

## Non-Responsibilities

- Does not write tests, design schemas, or grant business/architecture sign-off.

## Inputs

- Passing test/eval results (Test & Eval Agent).
- Approved code (Backend Agent, Frontend Agent).
- Tony's architecture + security sign-off (mandatory gate before any production permission, per root AGENT.md workflow).

## Tools

- Bash (`docker compose`, `git`), CI configuration.

## Output Format

Deployed services + a release log entry: `{ version, commit, tests_passed: bool, eval_score, approved_by, timestamp }`.

## Constraints

- No `--no-verify`, no skipped hooks.
- Never deploy past Tony's sign-off gate, regardless of how clean the test run looks.
- Never deploy a context, schema, or code change without the regression + eval suite passing.

## Quality Requirements

Every release entry is traceable to the exact commit, test run, and approver — no release without a paper trail.

## Escalation Rules

Any failing test or eval score below threshold at deploy time → block the release, notify Tony. Do not deploy "to see what happens."

## Handoffs

Deployed services → Observability Agent (monitoring begins immediately), Migration Agent (if DB changes accompany the release).
