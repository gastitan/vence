import { z } from 'zod';
import { RuleSchema } from './ruleSchema.js';
import { ACCOUNT_TYPES } from '../domain/Account.js';

const dayOfMonthSchema = z.number().int().min(1).max(31);
const offsetSchema = z.number().int().min(0).max(60);
const preferredWeekdaySchema = z.number().int().min(0).max(6);

/** API rule for Create Bill: FIXED_DAY with fixedDay (1–31). */
const CreateBillFixedDayRuleSchema = z.object({
  type: z.literal('FIXED_DAY'),
  fixedDay: dayOfMonthSchema,
});

/** API rule for Create Bill: RANGE (matches existing engine). */
const CreateBillRangeRuleSchema = z
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

export const CreateBillRuleSchema = z.discriminatedUnion('type', [
  CreateBillFixedDayRuleSchema,
  CreateBillRangeRuleSchema,
]);
export type CreateBillRule = z.infer<typeof CreateBillRuleSchema>;

export const CreateBillBodySchema = z.object({
  accountId: z.string().uuid('accountId must be a valid UUID'),
  name: z.string().min(1, 'Name is required').max(255),
  amount: z.number().positive('Amount must be positive').finite(),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  rule: CreateBillRuleSchema,
});
export type CreateBillBody = z.infer<typeof CreateBillBodySchema>;

export const CreateAccountBodySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(ACCOUNT_TYPES),
});
export type CreateAccountBody = z.infer<typeof CreateAccountBodySchema>;

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const DueInstancesQuerySchema = z.object({
  from: isoDateString,
  to: isoDateString,
});
export type DueInstancesQuery = z.infer<typeof DueInstancesQuerySchema>;

export const PayDueInstanceBodySchema = z.object({
  confirmedAmount: z.number().finite().optional(),
});
export type PayDueInstanceBody = z.infer<typeof PayDueInstanceBodySchema>;

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

export const SimulateCardBodySchema = z
  .object({
    closingRangeStart: dayOfMonthSchema,
    closingRangeEnd: dayOfMonthSchema,
    dueOffsetDays: offsetSchema,
    preferredWeekday: preferredWeekdaySchema.optional(),
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
    preferredWeekday: preferredWeekdaySchema.optional(),
  })
  .refine((data) => data.closingRangeStart <= data.closingRangeEnd, {
    message: 'closingRangeStart must be less than or equal to closingRangeEnd',
    path: ['closingRangeEnd'],
  });
export type CreateCardBody = z.infer<typeof CreateCardBodySchema>;
