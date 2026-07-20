-- Risk band orientation fix (Tony's ruling 2026-07-20): a HIGH total score
-- means many checks passed, i.e. LOW risk. The seeded bands were inverted —
-- score 90 classified as HIGH risk while the DefaultRiskProfile manual's
-- worked example labels 90/100 LOW risk. Swap low/high on every profile
-- still carrying the inverted orientation. Idempotent: only touches rows
-- where low_risk_thresholds is still the [0,30]-style band.
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-20-invert-risk-threshold-bands.sql

UPDATE risk_profile
SET low_risk_thresholds = high_risk_thresholds,
    high_risk_thresholds = low_risk_thresholds
WHERE lower(low_risk_thresholds) = 0
  AND lower(high_risk_thresholds) > lower(low_risk_thresholds);
