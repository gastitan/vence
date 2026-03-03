/**
 * Domain DueInstance entity. Persistent financial obligation instance (one per bill per due date).
 * Isolated from Prisma/DB types.
 */

export const DUE_STATUSES = ['PENDING', 'PAID'] as const;
export type DueStatus = (typeof DUE_STATUSES)[number];

export interface DueInstance {
  id: string;
  billId: string;
  dueDate: Date;
  estimatedAmount: number | null;
  confirmedAmount: number | null;
  status: DueStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface CreateDueInstanceInput {
  billId: string;
  dueDate: Date;
  estimatedAmount?: number | null;
  confirmedAmount?: number | null;
  status?: DueStatus;
  paidAt?: Date | null;
}
