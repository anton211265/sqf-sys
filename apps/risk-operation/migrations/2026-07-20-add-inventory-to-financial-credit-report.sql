-- Default-profile scoring alignment (2026-07-20): Quick Ratio needs
-- inventory, which financial_credit_report never stored. Run manually:
--   docker compose exec -T postgres psql -U postgres -d "risk-operation" \
--     -f - < apps/risk-operation/migrations/2026-07-20-add-inventory-to-financial-credit-report.sql

ALTER TABLE "financial_credit_report"
  ADD COLUMN IF NOT EXISTS "inventory" NUMERIC;
