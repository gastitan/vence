/**
 * Transaction boundary. Exposes an opaque context so application/services
 * never depend on Prisma types.
 */
import { prisma } from './prisma/client.js';
import type { PrismaClient } from '../generated/prisma/client.js';

/** Opaque type for transaction context. Only infrastructure resolves it to PrismaClient. */
export type TransactionContext = { readonly __opaque: unique symbol };

export async function runWithTransaction<T>(
  fn: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) =>
    fn(tx as unknown as TransactionContext)
  );
}

/** For use only inside infrastructure. Resolves opaque context to Prisma client. */
export function getPrismaClient(tx: TransactionContext | undefined): PrismaClient {
  if (tx === undefined) return prisma;
  return tx as unknown as PrismaClient;
}
