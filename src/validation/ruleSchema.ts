import { z } from 'zod';

const dayOfMonthSchema = z.number().int().min(1).max(31);
const offsetSchema = z.number().int().min(0).max(60);
const preferredWeekdaySchema = z.number().int().min(0).max(6);

/** FIXED: day 1–31; API accepts "day" or "dayOfMonth", output is canonical dayOfMonth. */
const FixedDayRuleSchema = z
  .object({
    type: z.literal('FIXED'),
    dayOfMonth: dayOfMonthSchema.optional(),
    day: dayOfMonthSchema.optional(),
  })
  .refine((data) => data.dayOfMonth !== undefined || data.day !== undefined, {
    message: 'FIXED must have day or dayOfMonth',
    path: ['dayOfMonth'],
  })
  .transform((data): { type: 'FIXED'; dayOfMonth: number } => ({
    type: 'FIXED',
    dayOfMonth: data.dayOfMonth ?? (data.day as number),
  }));

/** RANGE: closing range (days 1–31), due offset 0–60, optional preferred weekday 0–6. */
const RangeRuleSchema = z
  .object({
    type: z.literal('RANGE'),
    closingRangeStart: dayOfMonthSchema,
    closingRangeEnd: dayOfMonthSchema,
    dueOffsetDays: offsetSchema,
    preferredWeekday: preferredWeekdaySchema.optional(),
  })
  .refine((data) => data.closingRangeStart <= data.closingRangeEnd, {
    message: 'closingRangeStart must be less than or equal to closingRangeEnd',
    path: ['closingRangeEnd'],
  });

export const RuleSchema = z.discriminatedUnion('type', [
  FixedDayRuleSchema,
  RangeRuleSchema,
]);

export type ValidatedRule = z.infer<typeof RuleSchema>;
