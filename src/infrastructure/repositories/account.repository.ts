/**
 * Account repository – persistence layer for Account entity.
 * Maps between domain types and Prisma/DB. No Express or HTTP here.
 */
import type { Account, CreateAccountInput } from '../../domain/Account.js';
import { prisma } from '../prisma/client.js';
import type { AccountType as PrismaAccountType } from '../../generated/prisma/enums.js';

function toDomain(row: {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Account['type'],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPrismaType(type: CreateAccountInput['type']): PrismaAccountType {
  return type as PrismaAccountType;
}

export async function create(data: CreateAccountInput): Promise<Account> {
  const row = await prisma.account.create({
    data: {
      name: data.name,
      type: toPrismaType(data.type),
    },
  });
  return toDomain(row);
}

export async function findById(id: string): Promise<Account | null> {
  const row = await prisma.account.findUnique({
    where: { id },
  });
  return row ? toDomain(row) : null;
}

export async function findAll(): Promise<Account[]> {
  const rows = await prisma.account.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toDomain);
}

export async function deleteById(id: string): Promise<boolean> {
  try {
    await prisma.account.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
