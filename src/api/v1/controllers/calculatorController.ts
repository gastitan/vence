import type { Request, Response } from 'express';
import { calculateNextDueDate, RuleType, type Rule } from '@dueflow/engine';
import { addDays, formatISODateLocal, parseISODateLocal } from '../../../utils/dateUtils.js';
import type { CalculateBody, PreviewBody, SimulateCardBody } from '../../../validation/index.js';
import { ValidationError } from '../../errors.js';
import { logger } from '../../../infrastructure/logger.js';

function parseDate(iso: string, fieldName: string): Date {
  const date = parseISODateLocal(iso);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date', { field: fieldName, value: iso });
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
  const { rule, referenceDate } = req.body as CalculateBody;
  const refDate = parseDate(referenceDate, 'referenceDate');
  const result = runCalculation(() =>
    calculateNextDueDate({ rule: rule as Rule, referenceDate: refDate, logger })
  );

  res.json({
    calculatedDate: formatISODateLocal(result.calculatedDate),
    isEstimated: result.isEstimated,
    confidence: result.confidence,
  });
}

export function previewHandler(req: Request, res: Response): void {
  const { rule, from, months } = req.body as PreviewBody;
  let currentRef = parseDate(from, 'from');
  const results: Array<{
    calculatedDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = runCalculation(() =>
      calculateNextDueDate({ rule: rule as Rule, referenceDate: currentRef, logger })
    );
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
    req.body as SimulateCardBody;

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

  let referenceDate = parseDate(from, 'from');
  const results: Array<{
    closingDate: string;
    dueDate: string;
    isEstimated: boolean;
    confidence: number;
  }> = [];

  for (let i = 0; i < months; i++) {
    const result = runCalculation(() =>
      calculateNextDueDate({ rule, referenceDate, logger })
    );
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
