import * as React from 'react';

import { Input } from 'components/ui/input';
import { Label } from 'components/ui/label';
import { RateCard, RateCardInput, percentToFraction } from 'types/ConfiguratorTypes';

/**
 * Shared rate-card field set (draft editor + bespoke workbench). UI works in
 * percent ("8.5"), the API in fractions (0.085) — conversion happens once,
 * in toPayload. Numeric fields left blank are simply omitted.
 */
export interface RateCardFormState {
  interestPct: string;
  advancePct: string;
  discountPct: string;
  adminFee: string;
  reservePct: string;
  minDays: string;
  maxDays: string;
  formulaType: string;
}

export const emptyRateCardForm: RateCardFormState = {
  interestPct: '',
  advancePct: '',
  discountPct: '',
  adminFee: '',
  reservePct: '',
  minDays: '30',
  maxDays: '360',
  formulaType: '',
};

export const rateCardToForm = (card: RateCard): RateCardFormState => ({
  interestPct: card.interestRateApr ? String(parseFloat(card.interestRateApr) * 100) : '',
  advancePct: card.advanceRatePct ? String(parseFloat(card.advanceRatePct) * 100) : '',
  discountPct: card.discountFeePct ? String(parseFloat(card.discountFeePct) * 100) : '',
  adminFee: card.oneTimeAdminFee ? String(parseFloat(card.oneTimeAdminFee)) : '',
  reservePct: card.reserveRetainPct ? String(parseFloat(card.reserveRetainPct) * 100) : '',
  minDays: String(card.minTenureDays),
  maxDays: String(card.maxTenureDays),
  formulaType: card.formulaType ?? '',
});

export const formToPayload = (form: RateCardFormState): RateCardInput => {
  const payload: RateCardInput = {};
  const pct = (v: string) => percentToFraction(parseFloat(v));
  if (form.interestPct.trim()) payload.interestRateApr = pct(form.interestPct);
  if (form.advancePct.trim()) payload.advanceRatePct = pct(form.advancePct);
  if (form.discountPct.trim()) payload.discountFeePct = pct(form.discountPct);
  if (form.adminFee.trim()) payload.oneTimeAdminFee = parseFloat(form.adminFee);
  if (form.reservePct.trim()) payload.reserveRetainPct = pct(form.reservePct);
  if (form.minDays.trim()) payload.minTenureDays = parseInt(form.minDays, 10);
  if (form.maxDays.trim()) payload.maxTenureDays = parseInt(form.maxDays, 10);
  if (form.formulaType) payload.formulaType = form.formulaType as RateCardInput['formulaType'];
  return payload;
};

interface RateCardFormProps {
  value: RateCardFormState;
  onChange: (next: RateCardFormState) => void;
  disabled?: boolean;
}

export function RateCardForm({ value, onChange, disabled = false }: RateCardFormProps) {
  const field = (key: keyof RateCardFormState, label: string, placeholder = '') => (
    <div>
      <Label htmlFor={`rc-${key}`}>{label}</Label>
      <Input
        id={`rc-${key}`}
        value={value[key]}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange({ ...value, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {field('interestPct', 'Interest APR %', 'e.g. 8.5')}
      {field('advancePct', 'Advance rate % (IF: 80–95)', 'e.g. 85')}
      {field('discountPct', 'Discount fee %', 'e.g. 2.15')}
      {field('adminFee', 'One-time admin fee', 'e.g. 1500')}
      {field('reservePct', 'Reserve retention %', 'e.g. 15')}
      {field('minDays', 'Min tenure (days)')}
      {field('maxDays', 'Max tenure (days, ≤3650)')}
      <div>
        <Label htmlFor="rc-formula">Calculation formula</Label>
        <select
          id="rc-formula"
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={value.formulaType}
          disabled={disabled}
          onChange={(e) => onChange({ ...value, formulaType: e.target.value })}
        >
          <option value="">(none)</option>
          <option value="COMPOUND_DAILY">COMPOUND_DAILY</option>
          <option value="SIMPLE_INTEREST">SIMPLE_INTEREST</option>
          <option value="TIERED_DISCOUNT">TIERED_DISCOUNT</option>
        </select>
      </div>
    </div>
  );
}
