/**
 * Domain Rule entity for persistence. Isolated from Prisma/DB types.
 * type + config represent the stored rule; engine Rule types are derived when needed.
 */

export const PERSISTENT_RULE_TYPES = ['FIXED_DAY', 'RANGE'] as const;
export type PersistentRuleType = (typeof PERSISTENT_RULE_TYPES)[number];

export interface Rule {
  id: string;
  type: PersistentRuleType;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRuleInput {
  type: PersistentRuleType;
  config: Record<string, unknown>;
}
