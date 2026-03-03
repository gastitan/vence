import type { Request, Response } from 'express';
import * as billService from '../../../services/bill.service.js';
import type { CreateBillBody } from '../../../validation/index.js';
import { NotFoundError, ValidationError } from '../../errors.js';
import { z } from 'zod';

const ListBillsQuerySchema = z.object({
  accountId: z.string().uuid('accountId must be a valid UUID'),
});

export async function createBillHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as CreateBillBody;
  const result = await billService.createBillWithEmbeddedRule({
    accountId: body.accountId,
    name: body.name,
    amount: body.amount,
    currency: body.currency,
    rule: body.rule,
  });
  res.status(201).json({
    id: result.id,
    accountId: result.accountId,
    name: result.name,
    amount: result.amount,
    currency: result.currency,
    rule: result.rule,
    createdDueInstances: result.createdDueInstances,
  });
}

export async function listBillsHandler(req: Request, res: Response): Promise<void> {
  const parsed = ListBillsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError('Invalid query', {
      details: parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  const { accountId } = parsed.data;
  const bills = await billService.listBills(accountId);
  res.json(bills);
}

export async function getBillHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const bill = await billService.getBillById(id);
  if (!bill) {
    throw new NotFoundError('Bill not found', { id });
  }
  res.json(bill);
}

export async function deleteBillHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const deleted = await billService.deleteBill(id);
  if (!deleted) {
    throw new NotFoundError('Bill not found', { id });
  }
  res.status(204).send();
}
