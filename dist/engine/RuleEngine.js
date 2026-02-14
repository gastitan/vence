import { addMonths, isBefore, startOfDay, startOfMonth } from 'date-fns';
import { setDayOfMonthClamped } from '../utils/dateUtils.js';
function isFixedDayRule(rule) {
    const maybe = rule;
    if (!maybe || typeof maybe !== 'object')
        return false;
    if (typeof maybe.type !== 'string')
        return false;
    if (typeof maybe.dayOfMonth !== 'number')
        return false;
    return (maybe.type === 'FIXED_DAY');
}
export function calculateNextDueDate(rule, referenceDate) {
    if (!isFixedDayRule(rule)) {
        throw new Error('Unsupported rule type (only FIXED_DAY is implemented).');
    }
    const ref = startOfDay(referenceDate);
    const currentMonthAnchor = startOfMonth(ref);
    const current = setDayOfMonthClamped(currentMonthAnchor, rule.dayOfMonth);
    if (isBefore(current.date, ref)) {
        const nextMonthAnchor = addMonths(currentMonthAnchor, 1);
        const next = setDayOfMonthClamped(nextMonthAnchor, rule.dayOfMonth);
        return {
            calculatedDate: next.date,
            isEstimated: next.isClamped,
            confidence: rule.type === 'FIXED_DAY' ? 1.0 : 0.9,
        };
    }
    return {
        calculatedDate: current.date,
        isEstimated: current.isClamped,
        confidence: rule.type === 'FIXED_DAY' ? 1.0 : 0.9,
    };
}
