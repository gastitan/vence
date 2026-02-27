/**
 * Bill application service. Creates bills and ensures due instance projection.
 * No Express or HTTP here.
 */
import * as billRepository from '../infrastructure/repositories/bill.repository.js';
import * as dueProjectionService from './dueProjection.service.js';
import { runWithTransaction } from '../infrastructure/transaction.js';
import type { CreateBillInput } from '../domain/Bill.js';
import type { Bill } from '../domain/Bill.js';

const DEFAULT_PROJECTION_MONTHS = 6;

/**
 * Creates a bill and generates future DueInstances in a single transaction.
 */
export async function createBill(input: CreateBillInput): Promise<Bill> {
  return runWithTransaction(async (tx) => {
    const bill = await billRepository.create(input, tx);
    await dueProjectionService.generateFutureInstances(
      bill.id,
      DEFAULT_PROJECTION_MONTHS,
      tx
    );
    return bill;
  });
}
