/**
 * Bill repository – persistence for Bill entity.
 * Maps between domain types and Prisma. No Express or HTTP here.
 */
import type { Bill, CreateBillInput } from '../../domain/Bill.js';
import { getPrismaClient } from '../transaction.js';
import type { TransactionContext } from '../transaction.js';

function toDomain(row: {
  id: string;
  accountId: string;
  ruleId: string;
  amount: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Bill {
  return {
    id: row.id,
    accountId: row.accountId,
    ruleId: row.ruleId,
    amount: row.amount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function create(
  data: CreateBillInput,
  tx?: TransactionContext
): Promise<Bill> {
  const client = getPrismaClient(tx);
  const row = await client.bill.create({
    data: {
      accountId: data.accountId,
      ruleId: data.ruleId,
      amount: data.amount ?? undefined,
    },
  });
  return toDomain(row);
}

export async function findById(id: string): Promise<Bill | null> {
  const client = getPrismaClient(undefined);
  const row = await client.bill.findUnique({
    where: { id },
  });
  return row ? toDomain(row) : null;
}

export async function findByIdWithAccountAndRule(id: string): Promise<{
  bill: Bill;
  account: { id: string; name: string; type: string };
  rule: { id: string; type: string; config: Record<string, unknown> };
} | null> {
  const client = getPrismaClient(undefined);
  const row = await client.bill.findUnique({
    where: { id },
    include: { account: true, rule: true },
  });
  if (!row) return null;
  return {
    bill: toDomain(row),
    account: {
      id: row.account.id,
      name: row.account.name,
      type: row.account.type,
    },
    rule: {
      id: row.rule.id,
      type: row.rule.type,
      config: row.rule.config as Record<string, unknown>,
    },
  };
}

export async function findAllCreditCards(): Promise<
  Array<{
    bill: Bill;
    account: { id: string; name: string; type: string };
    rule: { id: string; type: string; config: Record<string, unknown> };
  }>
> {
  const client = getPrismaClient(undefined);
  const rows = await client.bill.findMany({
    where: { account: { type: 'CREDIT' } },
    include: { account: true, rule: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => ({
    bill: toDomain(row),
    account: {
      id: row.account.id,
      name: row.account.name,
      type: row.account.type,
    },
    rule: {
      id: row.rule.id,
      type: row.rule.type,
      config: row.rule.config as Record<string, unknown>,
    },
  }));
}

export async function deleteById(id: string): Promise<boolean> {
  const client = getPrismaClient(undefined);
  try {
    await client.bill.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
