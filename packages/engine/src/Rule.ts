export const RuleType = {
  FIXED: "FIXED",
  RANGE: "RANGE",
} as const;

export type RuleType = (typeof RuleType)[keyof typeof RuleType];

/**
 * Fixed day every month. Day 1–31; if missing in a month, last day is used (estimated).
 */
export interface FixedDayRule {
  type: typeof RuleType.FIXED;
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

export type Rule = FixedDayRule | RangeRule;
