import { describe, it, expect } from 'vitest';
import { calculateNextDueDate } from './calculateNextDueDate.js';
import { RuleType, type Rule } from './Rule.js';

describe('calculateNextDueDate with RangeDayRule', () => {
  it('returns the first valid day of the range in the same month when reference date is before the range', () => {
    const rule: Rule = { type: RuleType.RANGE_DAY, fromDay: 20, toDay: 25 };
    const referenceDate = new Date(2025, 0, 10); // January 10, 2025

    const result = calculateNextDueDate({ rule, referenceDate });

    expect(result.calculatedDate).toEqual(new Date(2025, 0, 20)); // January 20, 2025
    expect(result.isEstimated).toBe(true);
    expect(result.confidence).toBe(0.6);
  });

  it('returns the first valid day of the range in the next month when reference date is after the range', () => {
    const rule: Rule = { type: RuleType.RANGE_DAY, fromDay: 5, toDay: 12 };
    const referenceDate = new Date(2025, 0, 15); // January 15, 2025 (after the range)

    const result = calculateNextDueDate({ rule, referenceDate });

    expect(result.calculatedDate).toEqual(new Date(2025, 1, 5)); // February 5, 2025
    expect(result.isEstimated).toBe(true);
    expect(result.confidence).toBe(0.6);
  });

  it('clamps to the last day of the month when the range exceeds month length (e.g. Feb 30–31)', () => {
    const rule: Rule = { type: RuleType.RANGE_DAY, fromDay: 30, toDay: 31 };
    const referenceDate = new Date(2025, 1, 10); // February 10, 2025

    const result = calculateNextDueDate({ rule, referenceDate });

    expect(result.calculatedDate).toEqual(new Date(2025, 1, 28)); // February 28, 2025
    expect(result.isEstimated).toBe(true);
    expect(result.confidence).toBe(0.6);
  });
});
