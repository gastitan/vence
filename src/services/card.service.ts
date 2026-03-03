/**
 * Card application service. Orchestrates Account + Rule + Bill for credit-card flows.
 * No Express or HTTP here; controllers call these functions.
 */
import * as accountRepository from '../infrastructure/repositories/account.repository.js';
import * as ruleRepository from '../infrastructure/repositories/rule.repository.js';
import * as billService from './bill.service.js';
import * as billRepository from '../infrastructure/repositories/bill.repository.js';
import type { CreateCardInput } from '../domain/Card.js';

export interface CardDto {
  id: string;
  closingRangeStart: number;
  closingRangeEnd: number;
  dueOffsetDays: number;
  preferredWeekday?: number;
}

function ruleConfigToCardDto(billId: string, config: Record<string, unknown>): CardDto {
  return {
    id: billId,
    closingRangeStart: config.closingRangeStart as number,
    closingRangeEnd: config.closingRangeEnd as number,
    dueOffsetDays: config.dueOffsetDays as number,
    ...(config.preferredWeekday !== undefined && {
      preferredWeekday: config.preferredWeekday as number,
    }),
  };
}

export async function createCard(data: CreateCardInput): Promise<CardDto> {
  const account = await accountRepository.create({
    name: 'Credit card',
    type: 'CREDIT',
  });
  const rule = await ruleRepository.create({
    type: 'RANGE',
    config: {
      closingRangeStart: data.closingRangeStart,
      closingRangeEnd: data.closingRangeEnd,
      dueOffsetDays: data.dueOffsetDays,
      ...(data.preferredWeekday !== undefined && { preferredWeekday: data.preferredWeekday }),
    },
  });
  const bill = await billService.createBill({
    accountId: account.id,
    ruleId: rule.id,
    name: 'Credit card',
    currency: 'USD',
  });
  return ruleConfigToCardDto(bill.id, rule.config);
}

export async function listCards(): Promise<CardDto[]> {
  const rows = await billRepository.findAllCreditCards();
  return rows.map((r) => ruleConfigToCardDto(r.bill.id, r.rule.config));
}

export async function deleteCard(id: string): Promise<boolean> {
  const composite = await billRepository.findByIdWithAccountAndRule(id);
  if (!composite) return false;
  await billRepository.deleteById(id);
  await ruleRepository.deleteById(composite.rule.id);
  return true;
}
