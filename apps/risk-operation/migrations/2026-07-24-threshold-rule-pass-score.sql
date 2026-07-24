-- Customer Portal pass 1 (2026-07-24): threshold rules were seeded with
-- score = 1 as a pass/fail flag, but the scoring engine treats rule score
-- as points out of 10 (scorePercent = score/10). A passing verdict must
-- award the sub-parameter's full weight — the ruling's ABC worked example
-- totals 87.5 exactly when pass = 10/10 (Gearing fails, its 12.5 weight is
-- the only loss). Applies to all three seeded profiles (1, 2, 4 — every
-- rule was score 1).
-- Apply manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-24-threshold-rule-pass-score.sql

UPDATE risk_quantitative_threshold_rule SET score = 10 WHERE score = 1;
