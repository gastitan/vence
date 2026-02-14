import { getDaysInMonth, setDate, startOfDay } from 'date-fns';
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}
/**
 * Returns a date in the same month as `monthAnchor`, clamping the day-of-month
 * to the month's last day if needed.
 *
 * This is a generic helper (no business logic).
 */
export function setDayOfMonthClamped(monthAnchor, dayOfMonth) {
    const anchor = startOfDay(monthAnchor);
    const maxDay = getDaysInMonth(anchor);
    const clampedDay = Math.min(Math.max(1, dayOfMonth), maxDay);
    const isClamped = clampedDay !== dayOfMonth;
    return { date: setDate(anchor, clampedDay), isClamped };
}
