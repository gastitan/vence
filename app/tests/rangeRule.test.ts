import { describe, it, expect } from 'vitest';
import { RangeRule } from '../rules/RangeRule.js';

describe('RangeRule', () => {
  it('should create a range rule', () => {
    const rule = new RangeRule('rule-1');
    expect(rule.id).toBe('rule-1');
    expect(rule.type).toBe('Range');
  });
});
