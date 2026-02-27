/**
 * Due projection service. Generates and maintains future DueInstances for a bill
 * using the rule engine. No Express or HTTP here.
 *
 * Algorithm (safeguards):
 * - Uses last existing dueDate as reference if present; otherwise current date.
 * - Never generates dueDate <= reference (safety guard in loop).
 * - Advances reference to day-after each generated instance so the next
 *   calculateNextDueDate yields the following occurrence (no manual month math).
 * - Does not modify past instances (only creates new rows).
 * - Unique (billId, dueDate) is respected by generating strictly increasing dates.
 * - Coverage = instances with dueDate in [now, now+months); we only create future dates.
 */
import { calculateNextDueDate } from '@dueflow/engine';
import type { Rule } from '@dueflow/engine';
import * as billRepository from '../infrastructure/repositories/bill.repository.js';
import * as dueInstanceRepository from '../infrastructure/repositories/dueInstance.repository.js';
import type { CreateDueInstanceInput } from '../domain/DueInstance.js';
import { addDays, addMonths, startOfDay } from '../utils/dateUtils.js';
import type { TransactionContext } from '../infrastructure/transaction.js';

export interface GenerateFutureInstancesOptions {
  /** If set, used as "now" for coverage window (today and targetEnd). Enables deterministic tests. */
  referenceNow?: Date;
}

function toEngineRule(
  type: string,
  config: Record<string, unknown>
): Rule {
  if (type === 'FIXED_DAY') {
    const day = config.day ?? config.dayOfMonth;
    if (typeof day !== 'number' || !Number.isFinite(day)) {
      throw new Error('FIXED_DAY rule must have day or dayOfMonth (1–31)');
    }
    return { type: 'FIXED', dayOfMonth: day };
  }
  if (type === 'RANGE') {
    return {
      type: 'RANGE',
      closingRangeStart: config.closingRangeStart as number,
      closingRangeEnd: config.closingRangeEnd as number,
      dueOffsetDays: config.dueOffsetDays as number,
      ...(config.preferredWeekday !== undefined && {
        preferredWeekday: config.preferredWeekday as number,
      }),
    };
  }
  throw new Error(`Unsupported rule type for projection: ${type}`);
}

/**
 * Generates future DueInstances for the given bill so that at least `months`
 * months of coverage exist. Does not modify past instances.
 * Unique (billId, dueDate) is respected; no manual month arithmetic — only
 * RuleEngine.calculateNextDueDate. When called during bill creation, pass `tx`.
 */
export async function generateFutureInstances(
  billId: string,
  months: number,
  tx?: TransactionContext,
  options?: GenerateFutureInstancesOptions
): Promise<number> {
  const composite = await billRepository.findByIdWithAccountAndRule(billId);
  if (!composite) throw new Error(`Bill not found: ${billId}`);

  const engineRule = toEngineRule(composite.rule.type, composite.rule.config);
  const estimatedAmount = composite.bill.amount ?? null;

  const now = options?.referenceNow ?? new Date();
  const today = startOfDay(now);
  const targetEnd = addMonths(today, months);

  const lastDue = await dueInstanceRepository.findLastDueDateByBillId(billId, tx);
  let referenceDate = lastDue ? addDays(lastDue, 1) : today;
  if (referenceDate < today) referenceDate = today;

  if (referenceDate >= targetEnd) return 0;

  const toCreate: CreateDueInstanceInput[] = [];

  while (referenceDate < targetEnd) {
    const result = calculateNextDueDate({
      rule: engineRule,
      referenceDate,
    });
    const dueDate = result.calculatedDate;
    if (dueDate <= referenceDate) break;
    if (dueDate >= targetEnd) break;
    toCreate.push({
      billId,
      dueDate,
      estimatedAmount,
      status: 'PENDING',
    });
    referenceDate = addDays(dueDate, 1);
  }

  if (toCreate.length === 0) return 0;
  return dueInstanceRepository.createMany(toCreate, tx);
}

/**
 * Ensures at least `months` months of future instances exist for the bill.
 * Generates only the missing ones. Use when you need to extend coverage (e.g. cron).
 */
export async function ensureFutureCoverage(
  billId: string,
  months: number,
  tx?: TransactionContext,
  options?: GenerateFutureInstancesOptions
): Promise<number> {
  return generateFutureInstances(billId, months, tx, options);
}
