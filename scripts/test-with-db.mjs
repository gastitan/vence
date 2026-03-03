#!/usr/bin/env node
/**
 * Runs Prisma migrations against the test DB, then runs Vitest with the same
 * DATABASE_URL so the app uses test.db (isolated from dev dueflow.db).
 * Do NOT mix dev and test DB.
 */
import { execSync } from 'node:child_process';

const testDbUrl = 'file:./test.db';
process.env.DATABASE_URL = process.env.DATABASE_URL || testDbUrl;

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});

execSync('npx vitest run', {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});
