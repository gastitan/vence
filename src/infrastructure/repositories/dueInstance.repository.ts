/**
 * DueInstance repository – persistence for DueInstance entity.
 * Maps between domain types and Prisma. Accepts optional transaction client.
 */
import type {
  DueInstance,
  CreateDueInstanceInput,
  DueStatus as DomainDueStatus,
} from '../../domain/DueInstance.js';
import { getPrismaClient } from '../transaction.js';
import type { TransactionContext } from '../transaction.js';
import { DueStatus as PrismaDueStatus } from '../../generated/prisma/enums.js';

function toDomain(row: {
  id: string;
  billId: string;
  dueDate: Date;
  estimatedAmount: number | null;
  confirmedAmount: number | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}): DueInstance {
  return {
    id: row.id,
    billId: row.billId,
    dueDate: row.dueDate,
    estimatedAmount: row.estimatedAmount,
    confirmedAmount: row.confirmedAmount,
    status: row.status as DomainDueStatus,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
  };
}

function toPrismaStatus(status: DomainDueStatus): PrismaDueStatus {
  return status as PrismaDueStatus;
}

function getClient(tx: TransactionContext | undefined) {
  return getPrismaClient(tx);
}

export async function create(
  data: CreateDueInstanceInput,
  tx?: TransactionContext
): Promise<DueInstance> {
  const client = getClient(tx);
  const row = await client.dueInstance.create({
    data: {
      billId: data.billId,
      dueDate: data.dueDate,
      estimatedAmount: data.estimatedAmount ?? undefined,
      confirmedAmount: data.confirmedAmount ?? undefined,
      status: data.status ? toPrismaStatus(data.status) : PrismaDueStatus.PENDING,
      paidAt: data.paidAt ?? undefined,
    },
  });
  return toDomain(row);
}

export async function createMany(
  data: CreateDueInstanceInput[],
  tx?: TransactionContext
): Promise<number> {
  if (data.length === 0) return 0;
  const client = getClient(tx);
  const result = await client.dueInstance.createMany({
    data: data.map((d) => ({
      billId: d.billId,
      dueDate: d.dueDate,
      estimatedAmount: d.estimatedAmount ?? undefined,
      confirmedAmount: d.confirmedAmount ?? undefined,
      status: d.status ? toPrismaStatus(d.status) : PrismaDueStatus.PENDING,
      paidAt: d.paidAt ?? undefined,
    })),
  });
  return result.count;
}

export async function findFutureByBillId(billId: string): Promise<DueInstance[]> {
  const now = new Date();
  const client = getPrismaClient(undefined);
  const rows = await client.dueInstance.findMany({
    where: { billId, dueDate: { gte: now } },
    orderBy: { dueDate: 'asc' },
  });
  return rows.map(toDomain);
}

export async function findNextPending(): Promise<DueInstance | null> {
  const client = getPrismaClient(undefined);
  const row = await client.dueInstance.findFirst({
    where: { status: PrismaDueStatus.PENDING },
    orderBy: { dueDate: 'asc' },
  });
  return row ? toDomain(row) : null;
}

export async function findBetweenDates(
  start: Date,
  end: Date
): Promise<DueInstance[]> {
  const client = getPrismaClient(undefined);
  const rows = await client.dueInstance.findMany({
    where: {
      dueDate: { gte: start, lte: end },
    },
    orderBy: { dueDate: 'asc' },
  });
  return rows.map(toDomain);
}

export async function findLastDueDateByBillId(
  billId: string,
  tx?: TransactionContext
): Promise<Date | null> {
  const client = getClient(tx);
  const row = await client.dueInstance.findFirst({
    where: { billId },
    orderBy: { dueDate: 'desc' },
    select: { dueDate: true },
  });
  return row?.dueDate ?? null;
}

export async function markAsPaid(
  id: string,
  confirmedAmount?: number | null,
  paidAt?: Date | null,
  tx?: TransactionContext
): Promise<DueInstance | null> {
  const client = getClient(tx);
  const row = await client.dueInstance.update({
    where: { id },
    data: {
      status: PrismaDueStatus.PAID,
      confirmedAmount: confirmedAmount ?? undefined,
      paidAt: paidAt ?? new Date(),
    },
  });
  return toDomain(row);
}

export async function findById(
  id: string,
  tx?: TransactionContext
): Promise<DueInstance | null> {
  const client = getClient(tx);
  const row = await client.dueInstance.findUnique({
    where: { id },
  });
  return row ? toDomain(row) : null;
}

export async function findFirstPendingByBillId(
  billId: string
): Promise<DueInstance | null> {
  const client = getPrismaClient(undefined);
  const row = await client.dueInstance.findFirst({
    where: { billId, status: PrismaDueStatus.PENDING },
    orderBy: { dueDate: 'asc' },
  });
  return row ? toDomain(row) : null;
}

export async function findPendingByBillId(
  billId: string
): Promise<DueInstance[]> {
  const client = getPrismaClient(undefined);
  const rows = await client.dueInstance.findMany({
    where: { billId, status: PrismaDueStatus.PENDING },
    orderBy: { dueDate: 'asc' },
  });
  return rows.map(toDomain);
}

export async function sumPendingAmountByBillId(billId: string): Promise<number> {
  const instances = await findPendingByBillId(billId);
  return instances.reduce(
    (sum, i) => sum + (i.estimatedAmount ?? 0),
    0
  );
}
