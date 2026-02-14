import { addMonths, isBefore, startOfDay, startOfMonth } from 'date-fns';
import type { CalculationResult } from '../domain/CalculationResult.js';
import { RuleType, type Rule } from '../domain/Rule.js';
import { setDayOfMonthClamped } from '../utils/dateUtils.js';

type FixedDayLikeRule = {
  type: string;
  dayOfMonth: number;
};

type RangeDayLikeRule = {
  type: string;
  fromDay: number;
  toDay: number;
};

function isFixedDayRule(rule: Rule): rule is Rule & FixedDayLikeRule {
  const maybe = rule as unknown as Partial<FixedDayLikeRule> | null | undefined;
  if (!maybe || typeof maybe !== 'object') return false;
  if (typeof maybe.type !== 'string') return false;
  if (typeof maybe.dayOfMonth !== 'number') return false;

  return maybe.type === RuleType.FIXED_DAY;
}

function isRangeDayRule(rule: Rule): rule is Rule & RangeDayLikeRule {
  const maybe = rule as unknown as Partial<RangeDayLikeRule> | null | undefined;
  if (!maybe || typeof maybe !== 'object') return false;
  if (typeof maybe.type !== 'string') return false;
  if (typeof maybe.fromDay !== 'number') return false;
  if (typeof maybe.toDay !== 'number') return false;

  return maybe.type === RuleType.RANGE_DAY;
}

export function calculateNextDueDate(
  rule: Rule,
  referenceDate: Date
): CalculationResult {
  if (isFixedDayRule(rule)) {
    return calculateNextDueDateFixedDay(rule, referenceDate);
  }
  if (isRangeDayRule(rule)) {
    return calculateNextDueDateRangeDay(rule, referenceDate);
  }
  throw new Error(`Unsupported rule type (only ${RuleType.FIXED_DAY} and ${RuleType.RANGE_DAY} are implemented).`);
}

function calculateNextDueDateFixedDay(
  rule: Rule & FixedDayLikeRule,
  referenceDate: Date
): CalculationResult {
  const ref = startOfDay(referenceDate);
  const currentMonthAnchor = startOfMonth(ref);
  const current = setDayOfMonthClamped(currentMonthAnchor, rule.dayOfMonth);

  if (isBefore(current.date, ref)) {
    const nextMonthAnchor = addMonths(currentMonthAnchor, 1);
    const next = setDayOfMonthClamped(nextMonthAnchor, rule.dayOfMonth);

    return {
      calculatedDate: next.date,
      isEstimated: next.isClamped,
      confidence: 1.0,
    };
  }

  return {
    calculatedDate: current.date,
    isEstimated: current.isClamped,
    confidence: 1.0,
  };
}

function calculateNextDueDateRangeDay(
  rule: Rule & RangeDayLikeRule,
  referenceDate: Date
): CalculationResult {
  const ref = startOfDay(referenceDate);
  const currentMonthAnchor = startOfMonth(ref);
  // First valid day of [fromDay, toDay] is fromDay; clamp to month length via existing util
  const current = setDayOfMonthClamped(currentMonthAnchor, rule.fromDay);

  if (isBefore(current.date, ref)) {
    const nextMonthAnchor = addMonths(currentMonthAnchor, 1);
    const next = setDayOfMonthClamped(nextMonthAnchor, rule.fromDay);
    return {
      calculatedDate: next.date,
      isEstimated: true,
      confidence: 0.6,
    };
  }

  return {
    calculatedDate: current.date,
    isEstimated: true,
    confidence: 0.6,
  };
}
