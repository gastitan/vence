import type { Request, Response } from 'express';
import { calculateNextDueDate, RuleType, type Rule } from '@dueflow/engine';
import { addDays, formatISODateLocal, parseISODateLocal } from '../../../utils/dateUtils.js';
import { ValidationError } from '../../errors.js';

function parseAndValidateDate(value: unknown, fieldName: string): Date {
  if (typeof value !== 'string') {
    throw new ValidationError('Invalid date', { field: fieldName, expected: 'YYYY-MM-DD string' });
  }
  const date = parseISODateLocal(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date', { field: fieldName, value });
  }
  return date;
}

function runCalculation<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    if (err instanceof Error && /Unsupported rule type|rule type/.test(err.message)) {
      throw new ValidationError('Invalid or unsupported rule', { reason: err.message });
    }
    throw err;
  }
}

export function calculateHandler(req: Request, res: Response): void {
  const { rule, referenceDate } = req.body as {
    rule: Rule;
    referenceDate: string;
  };
  const refDate = parseAndValidateDate(referenceDate, 'referenceDate');
  const result = runCalculation(() => calculateNextDueDate({ rule, referenceDate: refDate }));

  res.json({
    calculatedDate: formatISODateLocal(result.calculatedDate),
    isEstimated: result.isEstimated,
    confidence: result.confidence,
  });
}

export function previewHandler(req: Request, res: Response): void {
  const { rule, from, months } = req.body as {
    rule: Rule;
    from: string;
    months: number;
  };

  let currentRef = parseAndValidateDate(from, 'from');
  const results: Array<{
    calculatedDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = runCalculation(() => calculateNextDueDate({ rule, referenceDate: currentRef }));
    results.push({
      calculatedDate: formatISODateLocal(result.calculatedDate),
      isEstimated: result.isEstimated,
      confidence: result.confidence,
    });
    currentRef = addDays(result.calculatedDate, 1);
  }

  res.json({ results });
}

export function simulateCardHandler(req: Request, res: Response): void {
  const { closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday, from, months } =
    req.body as {
      closingRangeStart: number;
      closingRangeEnd: number;
      dueOffsetDays: number;
      preferredWeekday?: number;
      from: string;
      months: number;
    };

  const rule: Rule = {
    type: RuleType.RANGE,
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    ...(preferredWeekday !== undefined && { preferredWeekday }),
  };

  const cardRule = {
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    ...(preferredWeekday !== undefined && { preferredWeekday }),
  };

  let referenceDate = parseAndValidateDate(from, 'from');
  const results: Array<{
    closingDate: string;
    dueDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = runCalculation(() => calculateNextDueDate({ rule, referenceDate }));
    const closingDate = addDays(result.calculatedDate, -dueOffsetDays);
    results.push({
      closingDate: formatISODateLocal(closingDate),
      dueDate: formatISODateLocal(result.calculatedDate),
      isEstimated: result.isEstimated,
      confidence: result.confidence,
    });
    referenceDate = addDays(result.calculatedDate, 1);
  }

  res.json({ cardRule, results });
}
