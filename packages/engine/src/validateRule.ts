import { RuleType } from './Rule.js';

const DAY_MIN = 1;
const DAY_MAX = 31;
const WEEKDAY_MIN = 0;
const WEEKDAY_MAX = 6;

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export interface ValidateRuleResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a rule (structure and bounds). Returns valid: true and empty errors when valid.
 */
export function validateRule(rule: unknown): ValidateRuleResult {
  const errors: string[] = [];
  if (!rule || typeof rule !== 'object') {
    return { valid: false, errors: ['rule must be an object'] };
  }
  const r = rule as Record<string, unknown>;
  const type = r.type as string | undefined;

  if (type === RuleType.RANGE) {
    if (!isNumber(r.closingRangeStart)) {
      errors.push('closingRangeStart must be a number');
    } else if (r.closingRangeStart < DAY_MIN || r.closingRangeStart > DAY_MAX) {
      errors.push('closingRangeStart must be between 1 and 31');
    }
    if (!isNumber(r.closingRangeEnd)) {
      errors.push('closingRangeEnd must be a number');
    } else if (r.closingRangeEnd < DAY_MIN || r.closingRangeEnd > DAY_MAX) {
      errors.push('closingRangeEnd must be between 1 and 31');
    }
    if (
      isNumber(r.closingRangeStart) &&
      isNumber(r.closingRangeEnd) &&
      r.closingRangeStart > r.closingRangeEnd
    ) {
      errors.push('closingRangeStart must be less than or equal to closingRangeEnd');
    }
    if (!isNumber(r.dueOffsetDays)) {
      errors.push('dueOffsetDays must be a number');
    } else if (r.dueOffsetDays < 0) {
      errors.push('dueOffsetDays must be >= 0');
    }
    if (r.preferredWeekday !== undefined && r.preferredWeekday !== null) {
      if (!isNumber(r.preferredWeekday)) {
        errors.push('preferredWeekday must be a number');
      } else if (
        r.preferredWeekday < WEEKDAY_MIN ||
        r.preferredWeekday > WEEKDAY_MAX
      ) {
        errors.push('preferredWeekday must be between 0 and 6');
      }
    }
  } else if (type === RuleType.FIXED_DAY) {
    if (!isNumber(r.dayOfMonth)) {
      errors.push('dayOfMonth must be a number');
    } else if (r.dayOfMonth < DAY_MIN || r.dayOfMonth > DAY_MAX) {
      errors.push('dayOfMonth must be between 1 and 31');
    }
  } else if (type === RuleType.RANGE_DAY) {
    if (!isNumber(r.fromDay)) {
      errors.push('fromDay must be a number');
    } else if (r.fromDay < DAY_MIN || r.fromDay > DAY_MAX) {
      errors.push('fromDay must be between 1 and 31');
    }
    if (!isNumber(r.toDay)) {
      errors.push('toDay must be a number');
    } else if (r.toDay < DAY_MIN || r.toDay > DAY_MAX) {
      errors.push('toDay must be between 1 and 31');
    }
    if (isNumber(r.fromDay) && isNumber(r.toDay) && r.fromDay > r.toDay) {
      errors.push('fromDay must be less than or equal to toDay');
    }
  } else {
    return {
      valid: false,
      errors: ['Unsupported or missing rule type (use RANGE, FIXED_DAY, or RANGE_DAY)'],
    };
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
