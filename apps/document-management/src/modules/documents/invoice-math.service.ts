import { Injectable } from '@nestjs/common';
import { InvoiceExtractionValidatedEvent } from '@app/common/apps/common/interface/invoice-extraction-validated-event.interface';
import { StoredDocument } from '../../models/document.entity';

export interface MathCheck {
  check: string;
  expected: number | null;
  actual: number | null;
  passed: boolean;
  detail?: string;
}

export interface InvoiceMathResult {
  passed: boolean;
  checks: MathCheck[];
}

interface ExtractedInvoiceLine {
  description?: string;
  quantity?: number | null;
  unitPrice?: number | null;
  lineExtensionAmount?: number | null;
}

interface ExtractedCharge {
  description?: string;
  amount?: number | null;
}

// Currency-cent tolerance for floating-point noise in extracted amounts.
const TOLERANCE = 0.01;

// The deterministic arithmetic gate (design decision 2026-07-19): this check
// replaces blanket human review on the invoice happy path. Every line must
// satisfy qty x unitPrice = lineExtensionAmount, and
// sum(lines) + tax + additional charges must equal the stated payable amount.
// Anything unverifiable (missing numbers) fails closed into the Finance
// Analyst reconciliation queue — never silently passes.
@Injectable()
export class InvoiceMathService {
  verify(extractedData: Record<string, unknown>): InvoiceMathResult {
    const checks: MathCheck[] = [];
    const lines = (extractedData.lines as ExtractedInvoiceLine[]) ?? [];
    const taxTotal = (extractedData.taxTotal as number | null) ?? 0;
    const charges = (extractedData.additionalCharges as ExtractedCharge[]) ?? [];
    const statedPayable = extractedData.statedPayableAmount as number | null;

    if (!lines.length) {
      checks.push({
        check: 'lines-present',
        expected: null,
        actual: null,
        passed: false,
        detail: 'No invoice lines were extracted',
      });
      return { passed: false, checks };
    }

    let linesSum = 0;
    lines.forEach((line, i) => {
      const label = `line[${i}] ${line.description ?? ''}`.trim();
      const { quantity, unitPrice, lineExtensionAmount } = line;
      if (
        quantity === null || quantity === undefined ||
        unitPrice === null || unitPrice === undefined ||
        lineExtensionAmount === null || lineExtensionAmount === undefined
      ) {
        checks.push({
          check: `${label}: qty x unitPrice = lineTotal`,
          expected: lineExtensionAmount ?? null,
          actual: null,
          passed: false,
          detail: 'Line has missing numeric values and cannot be verified',
        });
        return;
      }
      const computed = quantity * unitPrice;
      const passed = Math.abs(computed - lineExtensionAmount) <= TOLERANCE;
      checks.push({
        check: `${label}: qty x unitPrice = lineTotal`,
        expected: lineExtensionAmount,
        actual: Number(computed.toFixed(2)),
        passed,
      });
      linesSum += lineExtensionAmount;
    });

    const chargesSum = charges.reduce((s, c) => s + (c.amount ?? 0), 0);

    if (statedPayable === null || statedPayable === undefined) {
      checks.push({
        check: 'sum(lines) + tax + charges = statedPayableAmount',
        expected: null,
        actual: Number((linesSum + taxTotal + chargesSum).toFixed(2)),
        passed: false,
        detail: 'No stated payable amount was extracted',
      });
    } else {
      const computedTotal = linesSum + taxTotal + chargesSum;
      checks.push({
        check: 'sum(lines) + tax + charges = statedPayableAmount',
        expected: statedPayable,
        actual: Number(computedTotal.toFixed(2)),
        passed: Math.abs(computedTotal - statedPayable) <= TOLERANCE,
      });
    }

    return { passed: checks.every((c) => c.passed), checks };
  }

  // Maps a math-clean extracted invoice onto the CreateInvoiceDto line shape.
  // The extracted absolute tax total becomes a uniform per-line percent over
  // the goods lines (trade-directory recomputes totals server-side from
  // lines, so this keeps the created invoice's payable equal to the stated
  // total); freight/insurance-style charges become taxPercent-0 lines.
  buildSubmission(
    document: StoredDocument,
    eventId: string,
  ): InvoiceExtractionValidatedEvent {
    const data = document.extractedData ?? {};
    const lines = (data.lines as ExtractedInvoiceLine[]) ?? [];
    const charges = (data.additionalCharges as ExtractedCharge[]) ?? [];
    const taxTotal = (data.taxTotal as number | null) ?? 0;
    const goodsSum = lines.reduce(
      (s, l) => s + (l.lineExtensionAmount ?? 0),
      0,
    );
    const taxPercent =
      goodsSum > 0 ? Number(((taxTotal / goodsSum) * 100).toFixed(6)) : 0;

    return {
      eventId,
      documentUuid: document.documentUuid,
      refId: document.refId,
      uploaderOrgId: document.uploaderOrgId,
      uploadedByPersonId: document.uploadedByPersonId,
      invoice: {
        invoiceNumber: (data.invoiceNumber as string) ?? document.documentUuid,
        documentCurrencyCode: (data.currency as string) ?? 'MYR',
        issueDate: (data.issueDate as string) ?? new Date().toISOString().slice(0, 10),
        dueDate: (data.dueDate as string) ?? new Date().toISOString().slice(0, 10),
        issuerName: (data.issuerName as string) ?? 'UNKNOWN ISSUER',
        issuerRegistrationNumber:
          (data.issuerRegistrationNumber as string) ?? null,
        debtorName: (data.debtorName as string) ?? 'UNKNOWN DEBTOR',
        debtorRegistrationNumber:
          (data.debtorRegistrationNumber as string) ?? null,
        lines: [
          ...lines.map((l) => ({
            itemName: l.description ?? 'Line item',
            invoicedQuantity: l.quantity ?? 1,
            priceAmount: l.unitPrice ?? 0,
            taxPercent,
          })),
          ...charges
            .filter((c) => (c.amount ?? 0) > 0)
            .map((c) => ({
              itemName: c.description ?? 'Additional charge',
              invoicedQuantity: 1,
              priceAmount: c.amount as number,
              taxPercent: 0,
            })),
        ],
      },
    };
  }
}
