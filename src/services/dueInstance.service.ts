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

export async function getBetweenDates(
  from: Date,
  to: Date
): Promise<DueInstance[]> {
  return dueInstanceRepository.findBetweenDates(from, to);
}
