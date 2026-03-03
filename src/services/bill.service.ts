/**
 * Bill application service. Creates bills and ensures due instance projection.
 * No Express or HTTP here.
 */
import * as billRepository from '../infrastructure/repositories/bill.repository.js';
import * as ruleRepository from '../infrastructure/repositories/rule.repository.js';
import * as dueProjectionService from './dueProjection.service.js';
import * as dueInstanceRepository from '../infrastructure/repositories/dueInstance.repository.js';
import { runWithTransaction } from '../infrastructure/transaction.js';
import type { CreateBillInput } from '../domain/Bill.js';
import type { Bill } from '../domain/Bill.js';
import type { CreateBillRule } from '../validation/schemas.js';

const DEFAULT_PROJECTION_MONTHS = 6;
const BILL_API_PROJECTION_MONTHS = 3;

function ruleToPersistent(
  rule: CreateBillRule
): { type: 'FIXED_DAY' | 'RANGE'; config: Record<string, unknown> } {
  if (rule.type === 'FIXED_DAY') {
    return { type: 'FIXED_DAY', config: { day: rule.fixedDay } };
  }
  return {
    type: 'RANGE',
    config: {
      closingRangeStart: rule.closingRangeStart,
      closingRangeEnd: rule.closingRangeEnd,
      dueOffsetDays: rule.dueOffsetDays,
      ...(rule.preferredWeekday !== undefined && {
        preferredWeekday: rule.preferredWeekday,
      }),
    },
  };
}

/** Maps stored rule (type + config) to API response shape (fixedDay for FIXED_DAY). */
function ruleToApiShape(rule: {
  type: string;
  config: Record<string, unknown>;
}): Record<string, unknown> {
  if (rule.type === 'FIXED_DAY') {
    const day = rule.config.day ?? rule.config.dayOfMonth;
    return { type: 'FIXED_DAY', fixedDay: typeof day === 'number' ? day : 1 };
  }
  return { type: rule.type, ...rule.config };
}

/**
 * Creates a bill and generates future DueInstances in a single transaction.
 * Used by card flow (Rule created externally).
 */
export async function createBill(input: CreateBillInput): Promise<Bill> {
  return runWithTransaction(async (tx) => {
    const bill = await billRepository.create(input, tx);
    await dueProjectionService.generateFutureInstances(
      bill.id,
      DEFAULT_PROJECTION_MONTHS,
      tx
    );
    return bill;
  });
}

export interface CreateBillWithRuleInput {
  accountId: string;
  name: string;
  amount: number;
  currency: string;
  rule: CreateBillRule;
}

export interface CreateBillWithRuleResult {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  currency: string;
  rule: Record<string, unknown>;
  createdDueInstances: number;
}

/**
 * Creates a Bill with an embedded Rule and generates 3 months of future DueInstances.
 * Atomic transaction. Rule is not exposed as a public entity.
 */
export async function createBillWithEmbeddedRule(
  data: CreateBillWithRuleInput
): Promise<CreateBillWithRuleResult> {
  return runWithTransaction(async (tx) => {
    const { type, config } = ruleToPersistent(data.rule);
    const rule = await ruleRepository.create({ type, config }, tx);
    const bill = await billRepository.create(
      {
        accountId: data.accountId,
        ruleId: rule.id,
        name: data.name,
        amount: data.amount,
        currency: data.currency,
      },
      tx
    );
    const createdDueInstances =
      await dueProjectionService.generateFutureInstances(
        bill.id,
        BILL_API_PROJECTION_MONTHS,
        tx,
        { overrideEstimatedAmount: data.amount }
      );
    return {
      id: bill.id,
      accountId: bill.accountId,
      name: bill.name,
      amount: data.amount,
      currency: bill.currency,
      rule: data.rule as unknown as Record<string, unknown>,
      createdDueInstances,
    };
  });
}

export interface BillListEntry {
  id: string;
  accountId: string;
  name: string;
  amount: number | null;
  currency: string;
  rule: Record<string, unknown>;
  nextDueDate: string | null;
}

/**
 * Returns all non-deleted bills for an account with embedded rule and nextDueDate.
 */
export async function listBills(accountId: string): Promise<BillListEntry[]> {
  const rows = await billRepository.findManyByAccountId(accountId);
  const result: BillListEntry[] = [];
  for (const { bill, rule } of rows) {
    const next = await dueInstanceRepository.findFirstPendingByBillId(bill.id);
    result.push({
      id: bill.id,
      accountId: bill.accountId,
      name: bill.name,
      amount: bill.amount,
      currency: bill.currency,
      rule: ruleToApiShape(rule),
      nextDueDate: next ? next.dueDate.toISOString().slice(0, 10) : null,
    });
  }
  return result;
}

export interface BillDetailResult {
  id: string;
  accountId: string;
  name: string;
  amount: number | null;
  currency: string;
  rule: Record<string, unknown>;
  nextPendingDueInstance: {
    id: string;
    dueDate: string;
    estimatedAmount: number | null;
    status: string;
  } | null;
  totalPendingAmount: number;
}

/**
 * Returns a single bill by id with rule, next pending DueInstance, and total pending amount.
 * Returns null if bill not found or soft-deleted.
 */
export async function getBillById(id: string): Promise<BillDetailResult | null> {
  const composite = await billRepository.findByIdWithAccountAndRule(id);
  if (!composite) return null;
  const next = await dueInstanceRepository.findFirstPendingByBillId(
    composite.bill.id
  );
  const totalPending =
    await dueInstanceRepository.sumPendingAmountByBillId(composite.bill.id);
  return {
    id: composite.bill.id,
    accountId: composite.bill.accountId,
    name: composite.bill.name,
    amount: composite.bill.amount,
    currency: composite.bill.currency,
    rule: ruleToApiShape(composite.rule),
    nextPendingDueInstance: next
      ? {
          id: next.id,
          dueDate: next.dueDate.toISOString().slice(0, 10),
          estimatedAmount: next.estimatedAmount,
          status: next.status,
        }
      : null,
    totalPendingAmount: totalPending,
  };
}

/**
 * Soft-deletes a bill. Does not delete DueInstances.
 */
export async function deleteBill(id: string): Promise<boolean> {
  const bill = await billRepository.findById(id);
  if (!bill || bill.deletedAt != null) return false;
  return billRepository.softDelete(id);
}
