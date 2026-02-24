/**
 * Rule repository – persistence for Rule entity.
 * Maps between domain types and Prisma. No Express or HTTP here.
 */
import type { Rule, CreateRuleInput } from '../../domain/Rule.js';
import { prisma } from '../prisma/client.js';
import type { RuleType as PrismaRuleType } from '../../generated/prisma/enums.js';

function toDomain(row: {
  id: string;
  type: string;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Rule {
  return {
    id: row.id,
    type: row.type as Rule['type'],
    config: row.config as Record<string, unknown>,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPrismaType(type: CreateRuleInput['type']): PrismaRuleType {
  return type as PrismaRuleType;
}

export async function create(data: CreateRuleInput): Promise<Rule> {
  const row = await prisma.rule.create({
    data: {
      type: toPrismaType(data.type),
      config: data.config as object,
    },
  });
  return toDomain(row);
}

export async function findById(id: string): Promise<Rule | null> {
  const row = await prisma.rule.findUnique({
    where: { id },
  });
  return row ? toDomain(row) : null;
}

export async function deleteById(id: string): Promise<boolean> {
  try {
    await prisma.rule.delete({
      where: { id },
    });
    return true;
  } catch {
    return false;
  }
}
