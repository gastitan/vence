import { z } from 'zod';
import { RuleSchema } from './ruleSchema.js';

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const BaseCalculationRequestSchema = z.object({
  rule: RuleSchema,
  referenceDate: isoDateString,
});

export const CalculateBodySchema = BaseCalculationRequestSchema;
export type CalculateBody = z.infer<typeof CalculateBodySchema>;

export const PreviewBodySchema = BaseCalculationRequestSchema.extend({
  months: z.number().int().min(1).max(24),
});
export type PreviewBody = z.infer<typeof PreviewBodySchema>;

export const RulesValidateBodySchema = z.object({
  rule: RuleSchema,
});
export type RulesValidateBody = z.infer<typeof RulesValidateBodySchema>;

const offsetSchema = z.number().int().min(0).max(60);
const dayOfMonthSchema = z.number().int().min(1).max(31);
const preferredWeekdaySchema = z.number().int().min(0).max(6).optional();

export const SimulateCardBodySchema = z
  .object({
    closingRangeStart: dayOfMonthSchema,
    closingRangeEnd: dayOfMonthSchema,
    dueOffsetDays: offsetSchema,
    preferredWeekday: preferredWeekdaySchema,
    from: isoDateString,
    months: z.number().int().min(1).max(24),
  })
  .refine((data) => data.closingRangeStart <= data.closingRangeEnd, {
    message: 'closingRangeStart must be less than or equal to closingRangeEnd',
    path: ['closingRangeEnd'],
  });
export type SimulateCardBody = z.infer<typeof SimulateCardBodySchema>;

export const CreateCardBodySchema = z
  .object({
    closingRangeStart: dayOfMonthSchema,
    closingRangeEnd: dayOfMonthSchema,
    dueOffsetDays: offsetSchema,
    preferredWeekday: preferredWeekdaySchema,
  })
  .refine((data) => data.closingRangeStart <= data.closingRangeEnd, {
    message: 'closingRangeStart must be less than or equal to closingRangeEnd',
    path: ['closingRangeEnd'],
  });
export type CreateCardBody = z.infer<typeof CreateCardBodySchema>;
