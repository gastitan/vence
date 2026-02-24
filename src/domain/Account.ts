/**
 * Domain Account entity. Kept isolated from Prisma/DB types.
 */

export const ACCOUNT_TYPES = ['BANK', 'CREDIT', 'SERVICE', 'OTHER'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
}
