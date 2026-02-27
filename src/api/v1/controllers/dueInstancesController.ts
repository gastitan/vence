import type { Request, Response } from 'express';
import * as dueInstanceService from '../../../services/dueInstance.service.js';
import { DueInstancesQuerySchema } from '../../../validation/index.js';
import { parseISODateLocal } from '../../../utils/dateUtils.js';

export async function getNextPendingHandler(_req: Request, res: Response): Promise<void> {
  const instance = await dueInstanceService.getNextPending();
  if (!instance) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'No pending due instance' } });
    return;
  }
  res.json(serializeDueInstance(instance));
}

export async function getBetweenDatesHandler(req: Request, res: Response): Promise<void> {
  const parsed = DueInstancesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid query: from and to must be YYYY-MM-DD',
        details: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  const { from, to } = parsed.data;
  const fromDate = parseISODateLocal(from);
  const toDate = parseISODateLocal(to);
  if (fromDate > toDate) {
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'from must be before or equal to to' },
    });
    return;
  }
  const instances = await dueInstanceService.getBetweenDates(fromDate, toDate);
  res.json(instances.map(serializeDueInstance));
}

export async function payHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const body = req.body as { confirmedAmount?: number };
  const instance = await dueInstanceService.markAsPaid(id, body.confirmedAmount);
  if (!instance) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Due instance not found' } });
    return;
  }
  res.json(serializeDueInstance(instance));
}

function serializeDueInstance(instance: {
  id: string;
  billId: string;
  dueDate: Date;
  estimatedAmount: number | null;
  confirmedAmount: number | null;
  status: string;
  paidAt: Date | null;
  createdAt: Date;
}): Record<string, unknown> {
  return {
    id: instance.id,
    billId: instance.billId,
    dueDate: instance.dueDate.toISOString().slice(0, 10),
    estimatedAmount: instance.estimatedAmount,
    confirmedAmount: instance.confirmedAmount,
    status: instance.status,
    paidAt: instance.paidAt ? instance.paidAt.toISOString() : null,
    createdAt: instance.createdAt.toISOString(),
  };
}
