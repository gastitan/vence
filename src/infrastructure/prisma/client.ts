/**
 * Single Prisma client instance for the app.
 * Prisma 7 uses a driver adapter for SQLite; DATABASE_URL in prisma.config.ts.
 */
import path from 'node:path';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

function getDbPath(): string {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith('file:')) {
    return path.join(process.cwd(), 'dueflow.db');
  }
  const filePath = url.replace(/^file:/, '');
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

const adapter = new PrismaBetterSqlite3({ url: getDbPath() });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
