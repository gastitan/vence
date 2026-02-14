export const RuleType = {
  FIXED_DAY: "FIXED_DAY",
  RANGE: "RANGE",
  INSTALLMENT: "INSTALLMENT",
  RANGE_DAY: "RANGE_DAY",
} as const;

export type RuleType = (typeof RuleType)[keyof typeof RuleType];

/**
 * Fixed day every month. Day 1–31; if missing in a month, last day is used (estimated).
 */
export interface FixedDayRule {
  type: typeof RuleType.FIXED_DAY;
  dayOfMonth: number;
}

/**
 * Credit card: closing range (day X–Y), due = closing + offset days; optional preferred weekday.
 */
export interface RangeRule {
  type: typeof RuleType.RANGE;
  closingRangeStart: number;
  closingRangeEnd: number;
  dueOffsetDays: number;
  preferredWeekday?: number;
}

/**
 * Monthly installments on the same day as start; total count of installments.
 */
export interface InstallmentRule {
  type: typeof RuleType.INSTALLMENT;
  startDate: Date;
  totalInstallments: number;
}

/**
 * Due date within a day range [fromDay, toDay] in the month.
 * Uses the first valid day of the range; clamped to last day if needed.
 */
export interface RangeDayRule {
  type: typeof RuleType.RANGE_DAY;
  fromDay: number;
  toDay: number;
}

export type Rule = FixedDayRule | RangeRule | InstallmentRule | RangeDayRule;
