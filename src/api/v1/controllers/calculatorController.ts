import type { Request, Response } from 'express';
import { calculateNextDueDate, type Rule } from '@dueflow/engine';
import { addDays, formatISODateLocal, parseISODateLocal } from '../../../utils/dateUtils.js';

export function calculateHandler(req: Request, res: Response): void {
  const { rule, referenceDate } = req.body as {
    rule: Rule;
    referenceDate: string;
  };

  const refDate = parseISODateLocal(referenceDate);
  const result = calculateNextDueDate({ rule, referenceDate: refDate });

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

  let currentRef = parseISODateLocal(from);
  const results: Array<{
    calculatedDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = calculateNextDueDate({ rule, referenceDate: currentRef });
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
    type: 'RANGE',
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

  let referenceDate = parseISODateLocal(from);
  const results: Array<{
    closingDate: string;
    dueDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = calculateNextDueDate({ rule, referenceDate });
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
