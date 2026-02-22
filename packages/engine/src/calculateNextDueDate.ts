import type { CalculationResult } from './CalculationResult.js';
import { RuleType, type Rule } from './Rule.js';
import {
  addDays,
  addMonths,
  setDayOfMonthClamped,
  startOfDay,
  startOfMonth,
} from './dateUtils.js';

/** Input may use day (API alias) or dayOfMonth (canonical). */
type FixedDayLikeRule = {
  type: string;
  dayOfMonth?: number;
  day?: number;
};

type RangeDayLikeRule = {
  type: string;
  fromDay: number;
  toDay: number;
};

type RangeRuleLike = {
  type: string;
  closingRangeStart: number;
  closingRangeEnd: number;
  dueOffsetDays: number;
  preferredWeekday?: number;
};

function isFixedDayRule(rule: Rule): rule is Rule & FixedDayLikeRule {
  const maybe = rule as unknown as Partial<FixedDayLikeRule> | null | undefined;
  if (!maybe || typeof maybe !== 'object') return false;
  if (maybe.type !== RuleType.FIXED_DAY) return false;
  const dayVal = maybe.dayOfMonth ?? maybe.day;
  return typeof dayVal === 'number' && Number.isFinite(dayVal);
}

function isRangeDayRule(rule: Rule): rule is Rule & RangeDayLikeRule {
  const maybe = rule as unknown as Partial<RangeDayLikeRule> | null | undefined;
  if (!maybe || typeof maybe !== 'object') return false;
  if (typeof maybe.type !== 'string') return false;
  if (typeof maybe.fromDay !== 'number') return false;
  if (typeof maybe.toDay !== 'number') return false;
  return maybe.type === RuleType.RANGE_DAY;
}

function isRangeRule(rule: Rule): rule is Rule & RangeRuleLike {
  const maybe = rule as unknown as Partial<RangeRuleLike> | null | undefined;
  if (!maybe || typeof maybe !== 'object') return false;
  if (typeof maybe.type !== 'string') return false;
  if (typeof maybe.closingRangeStart !== 'number') return false;
  if (typeof maybe.closingRangeEnd !== 'number') return false;
  if (typeof maybe.dueOffsetDays !== 'number') return false;
  return maybe.type === RuleType.RANGE;
}

/**
 * Minimal logger interface for optional structured logging.
 * Pass a compatible logger (e.g. pino) from the application; engine has no logging dependency.
 */
export interface CalculationLogger {
  info(obj: Record<string, unknown>): void;
}

export interface CalculateNextDueDateParams {
  rule: Rule;
  referenceDate: Date;
  /** Optional logger for structured calculation logs (rule type, dates, confidence). */
  logger?: CalculationLogger;
}

export function calculateNextDueDate({
  rule,
  referenceDate,
  logger: log,
}: CalculateNextDueDateParams): CalculationResult {
  let result: CalculationResult;
  if (isFixedDayRule(rule)) {
    result = calculateNextDueDateFixedDay(rule, referenceDate);
  } else if (isRangeDayRule(rule)) {
    result = calculateNextDueDateRangeDay(rule, referenceDate);
  } else if (isRangeRule(rule)) {
    result = calculateNextDueDateRange(rule, referenceDate);
  } else {
    throw new Error(
      `Unsupported rule type (only ${RuleType.FIXED_DAY}, ${RuleType.RANGE_DAY}, and ${RuleType.RANGE} are implemented).`
    );
  }

  if (log) {
    log.info({
      msg: 'calculateNextDueDate',
      ruleType: rule.type,
      referenceDate: referenceDate.toISOString(),
      calculatedDate: result.calculatedDate.toISOString(),
      confidence: result.confidence,
      isEstimated: result.isEstimated,
    });
  }

  return result;
}

function getFixedDay(rule: Rule & FixedDayLikeRule): number {
  const day = rule.dayOfMonth ?? rule.day;
  if (typeof day !== 'number' || !Number.isFinite(day)) {
    throw new Error('FIXED_DAY rule must have day or dayOfMonth (1–31)');
  }
  return day;
}

function calculateNextDueDateFixedDay(
  rule: Rule & FixedDayLikeRule,
  referenceDate: Date
): CalculationResult {
  const dayOfMonth = getFixedDay(rule);
  const ref = startOfDay(referenceDate);
  const currentMonthAnchor = startOfMonth(ref);
  const current = setDayOfMonthClamped(currentMonthAnchor, dayOfMonth);

  if (current.date.getTime() < ref.getTime()) {
    const nextMonthAnchor = addMonths(currentMonthAnchor, 1);
    const next = setDayOfMonthClamped(nextMonthAnchor, dayOfMonth);
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
  const current = setDayOfMonthClamped(currentMonthAnchor, rule.fromDay);

  if (current.date.getTime() < ref.getTime()) {
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

function calculateNextDueDateRange(
  rule: Rule & RangeRuleLike,
  referenceDate: Date
): CalculationResult {
  const ref = startOfDay(referenceDate);
  const dayOfMonth = ref.getDate();
  const monthAnchor = startOfMonth(ref);

  let closingDate: Date;
  let clamped = false;

  if (dayOfMonth < rule.closingRangeStart) {
    const result = setDayOfMonthClamped(monthAnchor, rule.closingRangeStart);
    closingDate = result.date;
    clamped = result.isClamped;
  } else if (dayOfMonth >= rule.closingRangeStart && dayOfMonth <= rule.closingRangeEnd) {
    closingDate = ref;
  } else {
    const nextMonthAnchor = addMonths(monthAnchor, 1);
    const result = setDayOfMonthClamped(nextMonthAnchor, rule.closingRangeStart);
    closingDate = result.date;
    clamped = result.isClamped;
  }

  let dueDate = addDays(closingDate, rule.dueOffsetDays);
  let weekdayAdjusted = false;

  if (rule.preferredWeekday !== undefined) {
    const currentWeekday = dueDate.getDay();
    const daysToAdd = (rule.preferredWeekday - currentWeekday + 7) % 7;
    if (daysToAdd > 0) {
      dueDate = addDays(dueDate, daysToAdd);
      weekdayAdjusted = true;
    }
  }

  const isEstimated = clamped || weekdayAdjusted;
  const confidence = clamped ? 0.8 : weekdayAdjusted ? 0.9 : 1;

  return {
    calculatedDate: dueDate,
    isEstimated,
    confidence,
  };
}
