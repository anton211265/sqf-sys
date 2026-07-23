import { BadRequestException } from '@nestjs/common';

interface RateCardLikeFields {
  advanceRatePct?: number;
  minTenureDays?: number;
  maxTenureDays?: number;
}

/**
 * Cross-field business rules the DTO decorators can't express.
 * - Blueprint/spec: IF advance ceilings are restricted to 80–95%.
 * - Tenure window must be ordered and inside the 3650-day boundary
 *   (upper bound itself is enforced by the DTO).
 */
export function validateRateCardRules(
  productCode: string,
  fields: RateCardLikeFields,
  existing?: { minTenureDays: number; maxTenureDays: number },
): void {
  const min = fields.minTenureDays ?? existing?.minTenureDays ?? 30;
  const max = fields.maxTenureDays ?? existing?.maxTenureDays ?? 360;
  if (min > max) {
    throw new BadRequestException(
      `minTenureDays (${min}) cannot exceed maxTenureDays (${max})`,
    );
  }
  if (
    productCode === 'IF' &&
    fields.advanceRatePct !== undefined &&
    (fields.advanceRatePct < 0.8 || fields.advanceRatePct > 0.95)
  ) {
    throw new BadRequestException(
      'Invoice Factoring advance rate must be between 80% and 95% (0.80–0.95)',
    );
  }
}
