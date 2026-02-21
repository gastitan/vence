import { describe, it, expect } from 'vitest';
import { calculateNextDueDate } from './calculateNextDueDate.js';
import { RuleType, type Rule } from './Rule.js';

describe('calculateNextDueDate with RangeRule', () => {
  it('returns closing date + offset when reference date is before range', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 15,
      closingRangeEnd: 20,
      dueOffsetDays: 5,
    };
    const referenceDate = new Date(2025, 0, 10); // January 10, 2025

    const result = calculateNextDueDate({ rule, referenceDate });

    // closing = Jan 15, due = Jan 20
    expect(result.calculatedDate).toEqual(new Date(2025, 0, 20));
    expect(result.isEstimated).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it('uses reference date as closing when inside range', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 5,
      closingRangeEnd: 25,
      dueOffsetDays: 3,
    };
    const referenceDate = new Date(2025, 0, 15); // January 15, 2025

    const result = calculateNextDueDate({ rule, referenceDate });

    // closing = Jan 15 (ref), due = Jan 18
    expect(result.calculatedDate).toEqual(new Date(2025, 0, 18));
    expect(result.isEstimated).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it('uses next month closing when reference date is after range', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 5,
      closingRangeEnd: 12,
      dueOffsetDays: 8,
    };
    const referenceDate = new Date(2025, 0, 15); // January 15, 2025 (after range)

    const result = calculateNextDueDate({ rule, referenceDate });

    // closing = Feb 5, due = Feb 13
    expect(result.calculatedDate).toEqual(new Date(2025, 1, 13));
    expect(result.isEstimated).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it('adjusts to preferred weekday when defined', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 10,
      closingRangeEnd: 15,
      dueOffsetDays: 2,
      preferredWeekday: 3, // Wednesday
    };
    // Jan 12 (Sun) + 2 = Jan 14 (Tue). Next Wed = Jan 15
    const referenceDate = new Date(2025, 0, 12);

    const result = calculateNextDueDate({ rule, referenceDate });

    expect(result.calculatedDate).toEqual(new Date(2025, 0, 15));
    expect(result.calculatedDate.getDay()).toBe(3);
    expect(result.isEstimated).toBe(true);
    expect(result.confidence).toBe(0.9);
  });

  it('calculates due date from ISO reference without timezone drift (ref in range, dueOffsetDays 8)', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
    };
    const referenceDate = new Date(2025, 0, 8); // 2025-01-08 local

    const result = calculateNextDueDate({ rule, referenceDate });

    expect(result.calculatedDate).toEqual(new Date(2025, 0, 16));
    expect(result.calculatedDate.getFullYear()).toBe(2025);
    expect(result.calculatedDate.getMonth()).toBe(0);
    expect(result.calculatedDate.getDate()).toBe(16);
    expect(result.isEstimated).toBe(false);
    expect(result.confidence).toBe(1);
  });

  it('clamps to last day of month when closing range day exceeds month length (e.g., 31 in February)', () => {
    const rule: Rule = {
      type: RuleType.RANGE,
      closingRangeStart: 31,
      closingRangeEnd: 31,
      dueOffsetDays: 0,
    };
    const referenceDate = new Date(2025, 1, 10); // February 10, 2025

    const result = calculateNextDueDate({ rule, referenceDate });

    // closing = Feb 28 (clamped), due = Feb 28
    expect(result.calculatedDate).toEqual(new Date(2025, 1, 28));
    expect(result.isEstimated).toBe(true);
    expect(result.confidence).toBe(0.8);
  });
});
