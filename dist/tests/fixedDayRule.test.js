import { describe, it, expect } from '@jest/globals';
import { calculateNextDueDate } from '../engine/RuleEngine.js';
describe('calculateNextDueDate with FixedDayRule', () => {
    it('returns a due date later in the same month when reference date is before the fixed day', () => {
        const rule = { type: 'fixedDay', dayOfMonth: 20 };
        const referenceDate = new Date(2025, 0, 10); // January 10, 2025
        const result = calculateNextDueDate(rule, referenceDate);
        expect(result.calculatedDate).toEqual(new Date(2025, 0, 20)); // January 20, 2025
        expect(result.isEstimated).toBe(false);
        expect(result.confidence).toBe(1.0);
    });
    it('returns a due date in the next month when reference date is after the fixed day of the current month', () => {
        const rule = { type: 'fixedDay', dayOfMonth: 5 };
        const referenceDate = new Date(2025, 0, 10); // January 10, 2025 (after the 5th)
        const result = calculateNextDueDate(rule, referenceDate);
        expect(result.calculatedDate).toEqual(new Date(2025, 1, 5)); // February 5, 2025
        expect(result.isEstimated).toBe(false);
        expect(result.confidence).toBe(1.0);
    });
    it('clamps to the last day of the month and marks as estimated when the fixed day does not exist (e.g., 31 in February)', () => {
        const rule = { type: 'fixedDay', dayOfMonth: 31 };
        const referenceDate = new Date(2025, 1, 10); // February 10, 2025
        const result = calculateNextDueDate(rule, referenceDate);
        expect(result.calculatedDate).toEqual(new Date(2025, 1, 28)); // February 28, 2025
        expect(result.isEstimated).toBe(true);
        expect(result.confidence).toBe(1.0);
    });
});
