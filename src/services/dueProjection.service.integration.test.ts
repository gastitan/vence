/**
 * Integration tests for DueProjectionService. Use injected referenceNow for
 * deterministic behavior; test DB is isolated (file:./test.db when run via npm test).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as accountRepository from '../infrastructure/repositories/account.repository.js';
import * as ruleRepository from '../infrastructure/repositories/rule.repository.js';
import * as billRepository from '../infrastructure/repositories/bill.repository.js';
import * as dueInstanceRepository from '../infrastructure/repositories/dueInstance.repository.js';
import {
  generateFutureInstances,
  type GenerateFutureInstancesOptions,
} from './dueProjection.service.js';
import { prisma } from '../infrastructure/prisma/client.js';
import { createLocalDate, addMonths } from '../utils/dateUtils.js';

function refOptions(referenceNow: Date): GenerateFutureInstancesOptions {
  return { referenceNow };
}

describe('DueProjectionService', () => {
  beforeEach(async () => {
    await prisma.dueInstance.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.rule.deleteMany({});
    await prisma.account.deleteMany({});
  });

  describe('initial generation', () => {
    it('creates 6 future instances for FIXED_DAY 15, strictly increasing, all > now', async () => {
      const account = await accountRepository.create({
        name: 'Test',
        type: 'SERVICE',
      });
      const rule = await ruleRepository.create({
        type: 'FIXED_DAY',
        config: { dayOfMonth: 15 },
      });
      const bill = await billRepository.create({
        accountId: account.id,
        ruleId: rule.id,
      });

      const now = createLocalDate(2025, 0, 10);
      const count = await generateFutureInstances(
        bill.id,
        6,
        undefined,
        refOptions(now)
      );

      expect(count).toBe(6);
      const endRange = addMonths(now, 12);
      const instances = await dueInstanceRepository.findBetweenDates(
        now,
        endRange
      );
      expect(instances).toHaveLength(6);

      for (let i = 1; i < instances.length; i++) {
        expect(instances[i].dueDate.getTime()).toBeGreaterThan(
          instances[i - 1].dueDate.getTime()
        );
      }
      const minDue = instances[0].dueDate.getTime();
      expect(minDue).toBeGreaterThan(now.getTime());
    });
  });

  describe('idempotency', () => {
    it('calling generateFutureInstances twice does not create duplicates, count stable', async () => {
      const account = await accountRepository.create({
        name: 'Test',
        type: 'SERVICE',
      });
      const rule = await ruleRepository.create({
        type: 'FIXED_DAY',
        config: { dayOfMonth: 20 },
      });
      const bill = await billRepository.create({
        accountId: account.id,
        ruleId: rule.id,
      });

      const now = createLocalDate(2025, 2, 1);
      const count1 = await generateFutureInstances(
        bill.id,
        6,
        undefined,
        refOptions(now)
      );
      expect(count1).toBeGreaterThan(0);

      const count2 = await generateFutureInstances(
        bill.id,
        6,
        undefined,
        refOptions(now)
      );
      expect(count2).toBe(0);

      const instances = await dueInstanceRepository.findBetweenDates(
        now,
        createLocalDate(2026, 0, 1)
      );
      const uniques = new Set(instances.map((i) => i.dueDate.getTime()));
      expect(uniques.size).toBe(instances.length);
    });
  });

  describe('February edge (FIXED_DAY 31)', () => {
    it('February is clamped to 28/29 and next month resumes correctly', async () => {
      const account = await accountRepository.create({
        name: 'Test',
        type: 'SERVICE',
      });
      const rule = await ruleRepository.create({
        type: 'FIXED_DAY',
        config: { dayOfMonth: 31 },
      });
      const bill = await billRepository.create({
        accountId: account.id,
        ruleId: rule.id,
      });

      const now = createLocalDate(2025, 0, 1);
      await generateFutureInstances(bill.id, 6, undefined, refOptions(now));

      const endRange = addMonths(now, 12);
      const instances = await dueInstanceRepository.findBetweenDates(
        now,
        endRange
      );
      const jan = instances.find((i) => i.dueDate.getMonth() === 0);
      const feb = instances.find((i) => i.dueDate.getMonth() === 1);
      const mar = instances.find((i) => i.dueDate.getMonth() === 2);

      expect(jan?.dueDate.getDate()).toBe(31);
      expect(feb?.dueDate.getDate()).toBe(28);
      expect(mar?.dueDate.getDate()).toBe(31);
    });
  });

  describe('year boundary', () => {
    it('generates across December → January with correct year rollover', async () => {
      const account = await accountRepository.create({
        name: 'Test',
        type: 'SERVICE',
      });
      const rule = await ruleRepository.create({
        type: 'FIXED_DAY',
        config: { dayOfMonth: 10 },
      });
      const bill = await billRepository.create({
        accountId: account.id,
        ruleId: rule.id,
      });

      const now = createLocalDate(2025, 10, 15);
      await generateFutureInstances(bill.id, 4, undefined, refOptions(now));

      const endRange = addMonths(now, 6);
      const instances = await dueInstanceRepository.findBetweenDates(
        now,
        endRange
      );
      const dec = instances.find(
        (i) => i.dueDate.getMonth() === 11 && i.dueDate.getFullYear() === 2025
      );
      const jan = instances.find(
        (i) => i.dueDate.getMonth() === 0 && i.dueDate.getFullYear() === 2026
      );

      expect(dec).toBeDefined();
      expect(dec?.dueDate.getDate()).toBe(10);
      expect(jan).toBeDefined();
      expect(jan?.dueDate.getDate()).toBe(10);
    });
  });

  describe('past immutability', () => {
    it('after marking one instance PAID, regenerate leaves it unchanged', async () => {
      const account = await accountRepository.create({
        name: 'Test',
        type: 'SERVICE',
      });
      const rule = await ruleRepository.create({
        type: 'FIXED_DAY',
        config: { dayOfMonth: 5 },
      });
      const bill = await billRepository.create({
        accountId: account.id,
        ruleId: rule.id,
      });

      const now = createLocalDate(2025, 0, 1);
      await generateFutureInstances(bill.id, 6, undefined, refOptions(now));

      const endRange = addMonths(now, 12);
      const instances = await dueInstanceRepository.findBetweenDates(
        now,
        endRange
      );
      expect(instances.length).toBeGreaterThanOrEqual(1);
      const toMark = instances[0];
      await dueInstanceRepository.markAsPaid(toMark.id, 100, new Date());

      await generateFutureInstances(bill.id, 6, undefined, refOptions(now));

      const updated = await dueInstanceRepository.findById(toMark.id);
      expect(updated?.status).toBe('PAID');
      expect(updated?.confirmedAmount).toBe(100);
    });
  });
});
