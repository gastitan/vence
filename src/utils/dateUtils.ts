/**
 * Timezone-safe date utilities. All functions treat dates as local calendar values
 * (no UTC parsing/formatting) to avoid drift when adding days or formatting.
 */

/**
 * Returns a Date at local midnight: 00:00:00.000.
 */
export function createLocalDate(
  year: number,
  monthIndex: number,
  day: number
): Date {
  return new Date(year, monthIndex, day);
}

/**
 * Parses YYYY-MM-DD as a local date. Does NOT use new Date(iso).
 */
export function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return createLocalDate(y, m - 1, d);
}

/**
 * Formats date as YYYY-MM-DD using local getFullYear/getMonth/getDate (no timezone shift).
 */
export function formatISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(day)}`;
}

/**
 * Adds days in local time; returns a new date at local midnight.
 */
export function addDays(date: Date, days: number): Date {
  const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  out.setDate(out.getDate() + days);
  return out;
}

/**
 * Adds months; day is clamped to last day of month if needed.
 * Returns local midnight.
 */
export function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  const day = date.getDate();
  const anchor = new Date(y, m, 1);
  const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return createLocalDate(anchor.getFullYear(), anchor.getMonth(), clampedDay);
}

/**
 * Normalizes to local midnight (same calendar day).
 */
export function startOfDay(date: Date): Date {
  return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * First day of the same month at local midnight.
 */
export function startOfMonth(date: Date): Date {
  return createLocalDate(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Returns a date in the same month as monthAnchor, clamping the day-of-month
 * to the month's last day if needed. Uses local calendar only.
 */
export function setDayOfMonthClamped(
  monthAnchor: Date,
  dayOfMonth: number
): { date: Date; isClamped: boolean } {
  const start = startOfDay(monthAnchor);
  const maxDay = getDaysInMonth(start);
  const clampedDay = Math.min(Math.max(1, dayOfMonth), maxDay);
  const isClamped = clampedDay !== dayOfMonth;
  return { date: createLocalDate(start.getFullYear(), start.getMonth(), clampedDay), isClamped };
}
