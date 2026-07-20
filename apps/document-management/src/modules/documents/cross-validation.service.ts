import { Injectable, Logger } from '@nestjs/common';
import { DocumentValidationDataEvent } from '@app/common/apps/common/interface/document-validation-data-event.interface';
import { ClaudeExtractionService } from './claude-extraction.service';

export type FieldVerdict =
  | 'MATCH'
  | 'MISMATCH'
  | 'MISSING_IN_RECORD'
  | 'NOT_EXTRACTED';

export interface FieldComparison {
  field: string;
  extracted: string | null;
  stored: string | null;
  method: 'exact' | 'fuzzy_llm' | 'none';
  verdict: FieldVerdict;
  reasoning?: string;
}

export interface CrossValidationResult {
  organizationFound: boolean;
  fields: FieldComparison[];
  hasDiscrepancies: boolean;
}

// Deterministic-first cross-validation (design decision 2026-07-19): fields
// that normalize to equality are settled in code; only genuinely fuzzy pairs
// (name variants, address formats) go to Claude. The audit trail records
// which method decided each field.
@Injectable()
export class CrossValidationService {
  private readonly logger = new Logger(CrossValidationService.name);

  constructor(
    private readonly claudeExtractionService: ClaudeExtractionService,
  ) {}

  async validateCompanyRegistry(
    extractedData: Record<string, unknown>,
    validationData: DocumentValidationDataEvent,
  ): Promise<CrossValidationResult> {
    if (!validationData.organizationFound || !validationData.storedOrganization) {
      return {
        organizationFound: false,
        fields: [],
        hasDiscrepancies: true,
      };
    }

    const stored = validationData.storedOrganization;
    const fields: FieldComparison[] = [];
    const fuzzyQueue: { field: string; extractedValue: string; storedValue: string }[] = [];

    const compare = (
      field: string,
      extractedRaw: unknown,
      storedRaw: string | null | undefined,
      normalizer: (v: string) => string,
    ) => {
      const extracted =
        typeof extractedRaw === 'string' && extractedRaw.trim()
          ? extractedRaw.trim()
          : null;
      const storedValue = storedRaw?.trim() ? storedRaw.trim() : null;

      if (!extracted) {
        fields.push({ field, extracted: null, stored: storedValue, method: 'none', verdict: 'NOT_EXTRACTED' });
        return;
      }
      if (!storedValue) {
        fields.push({ field, extracted, stored: null, method: 'none', verdict: 'MISSING_IN_RECORD' });
        return;
      }
      if (normalizer(extracted) === normalizer(storedValue)) {
        fields.push({ field, extracted, stored: storedValue, method: 'exact', verdict: 'MATCH' });
        return;
      }
      fuzzyQueue.push({ field, extractedValue: extracted, storedValue });
      fields.push({ field, extracted, stored: storedValue, method: 'fuzzy_llm', verdict: 'MISMATCH' });
    };

    const idNormalizer = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const textNormalizer = (v: string) =>
      v.toUpperCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();

    compare('registrationNumber', extractedData.registrationNumber, stored.businessRegistrationNumber, idNormalizer);
    compare('companyName', extractedData.companyName, stored.organizationName, textNormalizer);
    compare('registeredAddress', extractedData.registeredAddress, stored.registeredAddress ?? stored.businessAddress, textNormalizer);
    compare('country', extractedData.country, stored.country, idNormalizer);
    compare('incorporationDate', extractedData.incorporationDate, stored.incorporationDate, idNormalizer);

    const directors = Array.isArray(extractedData.directors)
      ? (extractedData.directors as { fullName?: string }[])
      : [];
    const storedNames = validationData.storedDirectorNames ?? [];
    for (const director of directors) {
      const name = director?.fullName?.trim();
      if (!name) continue;
      const field = `director:${name}`;
      const exact = storedNames.find(
        (s) => textNormalizer(s) === textNormalizer(name),
      );
      if (exact) {
        fields.push({ field, extracted: name, stored: exact, method: 'exact', verdict: 'MATCH' });
      } else if (!storedNames.length) {
        fields.push({ field, extracted: name, stored: null, method: 'none', verdict: 'MISSING_IN_RECORD' });
      } else {
        fuzzyQueue.push({ field, extractedValue: name, storedValue: storedNames.join('; ') });
        fields.push({ field, extracted: name, stored: storedNames.join('; '), method: 'fuzzy_llm', verdict: 'MISMATCH' });
      }
    }

    if (fuzzyQueue.length) {
      const judgments =
        await this.claudeExtractionService.judgeFieldMatches(fuzzyQueue);
      for (const judgment of judgments) {
        const entry = fields.find(
          (f) => f.field === judgment.field && f.method === 'fuzzy_llm',
        );
        if (entry) {
          entry.verdict = judgment.verdict;
          entry.reasoning = judgment.reasoning;
        }
      }
    }

    const hasDiscrepancies = fields.some(
      (f) => f.verdict === 'MISMATCH' || f.verdict === 'MISSING_IN_RECORD',
    );

    return { organizationFound: true, fields, hasDiscrepancies };
  }
}
