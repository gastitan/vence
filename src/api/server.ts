import express from 'express';
import { calculateNextDueDate } from '../engine/RuleEngine.js';
import { RuleType, type Rule } from '../domain/Rule.js';
import { addDays, formatISODateLocal, parseISODateLocal } from '../utils/dateUtils.js';
import { createCard, deleteCard, getAllCards } from '../infrastructure/cardRepository.js';
import {
  validateRangeRule,
  validateFixedDayRule,
  validateRangeDayRule,
} from './ruleValidator.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/rules/validate', (req, res) => {
  const { rule } = req.body as { rule: unknown };
  if (!rule || typeof rule !== 'object') {
    res.status(400).json({
      valid: false,
      errors: ['body must contain a rule object'],
    });
    return;
  }
  const r = rule as Record<string, unknown>;
  const type = r.type as string | undefined;

  let errors: string[] = [];
  if (type === RuleType.RANGE) {
    errors = validateRangeRule(rule);
  } else if (type === RuleType.FIXED_DAY) {
    errors = validateFixedDayRule(rule);
  } else if (type === RuleType.RANGE_DAY) {
    errors = validateRangeDayRule(rule);
  } else {
    errors = ['Unsupported or missing rule type (use RANGE, FIXED_DAY, or RANGE_DAY)'];
  }

  if (errors.length > 0) {
    res.status(400).json({ valid: false, errors });
    return;
  }
  res.status(200).json({ valid: true });
});

app.post('/calculate', (req, res) => {
  const { rule, referenceDate } = req.body as {
    rule: Rule;
    referenceDate: string;
  };

  const refDate = parseISODateLocal(referenceDate);
  const result = calculateNextDueDate(rule, refDate);

  res.json({
    calculatedDate: formatISODateLocal(result.calculatedDate),
    isEstimated: result.isEstimated,
    confidence: result.confidence,
  });
});

app.post('/preview', (req, res) => {
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
    const result = calculateNextDueDate(rule, currentRef);
    results.push({
      calculatedDate: formatISODateLocal(result.calculatedDate),
      isEstimated: result.isEstimated,
      confidence: result.confidence,
    });
    currentRef = addDays(result.calculatedDate, 1);
  }

  res.json({ results });
});

app.post('/simulate-card', (req, res) => {
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
    const result = calculateNextDueDate(rule, referenceDate);
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
});

app.post('/cards', (req, res) => {
  const {
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    preferredWeekday,
  } = req.body as {
    closingRangeStart: number;
    closingRangeEnd: number;
    dueOffsetDays: number;
    preferredWeekday?: number;
  };

  if (
    typeof closingRangeStart !== 'number' ||
    typeof closingRangeEnd !== 'number' ||
    typeof dueOffsetDays !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const card = createCard({
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    ...(preferredWeekday !== undefined && { preferredWeekday }),
  });

  res.status(201).json(card);
});

app.get('/cards', (_req, res) => {
  const cards = getAllCards();
  res.json(cards);
});

app.delete('/cards/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  deleteCard(id);
  res.json({ success: true });
});

export { app };
