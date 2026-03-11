/**
 * DueInstance application service. Payment and query operations.
 * No Express or HTTP here.
 */
import * as dueInstanceRepository from '../infrastructure/repositories/dueInstance.repository.js';
import { runWithTransaction } from '../infrastructure/transaction.js';
import type { DueInstance } from '../domain/DueInstance.js';
import { ConflictError } from '../api/errors.js';

/**
 * Marks a due instance as paid. If confirmedAmount is not provided, uses estimatedAmount.
 * Sets status = PAID, confirmedAmount, paidAt = now(). Runs in a transaction.
 * Prevents double payment: throws ConflictError if status is already PAID.
 */
export async function markAsPaid(
  dueInstanceId: string,
  confirmedAmount?: number | null
): Promise<DueInstance | null> {
  return runWithTransaction(async (tx) => {
    const instance = await dueInstanceRepository.findById(dueInstanceId, tx);
    if (!instance) return null;
    if (instance.status === 'PAID') {
      throw new ConflictError('Due instance already paid', { id: dueInstanceId });
    }
    const amount = confirmedAmount ?? instance.estimatedAmount;
    return dueInstanceRepository.markAsPaid(
      dueInstanceId,
      amount,
      new Date(),
      tx
    );
  });
}

export async function getNextPending(): Promise<DueInstance | null> {
  return dueInstanceRepository.findNextPending();
}

/** Next pending due instance with bill and account (same shape as list for API DTO). */
export async function getNextPendingWithBillAndAccount(): Promise<
  Awaited<ReturnType<typeof dueInstanceRepository.findNextPendingWithBillAndAccount>>
> {
  return dueInstanceRepository.findNextPendingWithBillAndAccount();
}

export async function getBetweenDates(
  from: Date,
  to: Date
): Promise<DueInstance[]> {
  return dueInstanceRepository.findBetweenDates(from, to);
}

/**
 * Same date range as getBetweenDates but returns rows with bill and account included (for API).
 */
export async function getBetweenDatesWithBillAndAccount(
  from: Date,
  to: Date
): Promise<
  Array<{
    id: string;
    dueDate: Date;
    estimatedAmount: number | null;
    confirmedAmount: number | null;
    status: string;
    bill: {
      id: string;
      name: string;
      currency: string;
      account: { id: string; name: string; type: string };
    };
  }>
> {
  return dueInstanceRepository.findBetweenDatesWithBillAndAccount(from, to);
}
