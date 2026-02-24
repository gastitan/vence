/**
 * Bill repository – persistence for Bill entity.
 * Maps between domain types and Prisma. No Express or HTTP here.
 */
import type { Bill, CreateBillInput } from '../../domain/Bill.js';
import { prisma } from '../prisma/client.js';

function toDomain(row: {
  id: string;
  accountId: string;
  ruleId: string;
  createdAt: Date;
  updatedAt: Date;
}): Bill {
  return {
    id: row.id,
    accountId: row.accountId,
    ruleId: row.ruleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function create(data: CreateBillInput): Promise<Bill> {
  const row = await prisma.bill.create({
    data: {
      accountId: data.accountId,
      ruleId: data.ruleId,
    },
  });
  return toDomain(row);
}

export async function findById(id: string): Promise<Bill | null> {
  const row = await prisma.bill.findUnique({
    where: { id },
  });
  return row ? toDomain(row) : null;
}

export async function findByIdWithAccountAndRule(id: string): Promise<{
  bill: Bill;
  account: { id: string; name: string; type: string };
  rule: { id: string; type: string; config: Record<string, unknown> };
} | null> {
  const row = await prisma.bill.findUnique({
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
  const rows = await prisma.bill.findMany({
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
  try {
    await prisma.bill.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
