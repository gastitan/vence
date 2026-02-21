/**
 * Timezone-safe date utilities for the engine. All functions treat dates as local
 * calendar values (no UTC parsing/formatting). Internal use only; not exported from public API.
 */

export function createLocalDate(
  year: number,
  monthIndex: number,
  day: number
): Date {
  return new Date(year, monthIndex, day);
}

export function addDays(date: Date, days: number): Date {
  const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  out.setDate(out.getDate() + days);
  return out;
}

export function addMonths(date: Date, months: number): Date {
  const y = date.getFullYear();
  const m = date.getMonth() + months;
  const day = date.getDate();
  const anchor = new Date(y, m, 1);
  const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDay);
  return createLocalDate(anchor.getFullYear(), anchor.getMonth(), clampedDay);
}

export function startOfDay(date: Date): Date {
  return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return createLocalDate(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

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
