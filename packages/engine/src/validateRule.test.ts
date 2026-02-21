import { describe, it, expect } from 'vitest';
import { validateRule } from './validateRule.js';

describe('validateRule', () => {
  it('returns valid for a well-formed RANGE rule', () => {
    const result = validateRule({
      type: 'RANGE',
      closingRangeStart: 5,
      closingRangeEnd: 11,
      dueOffsetDays: 8,
      preferredWeekday: 1,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid with errors for RANGE with start > end', () => {
    const result = validateRule({
      type: 'RANGE',
      closingRangeStart: 20,
      closingRangeEnd: 10,
      dueOffsetDays: 5,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'closingRangeStart must be less than or equal to closingRangeEnd'
    );
  });

  it('returns valid for a well-formed FIXED_DAY rule', () => {
    const result = validateRule({ type: 'FIXED_DAY', dayOfMonth: 15 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for unsupported rule type', () => {
    const result = validateRule({ type: 'UNKNOWN' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns invalid when rule is not an object', () => {
    const result = validateRule(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('rule must be an object');
  });
});
