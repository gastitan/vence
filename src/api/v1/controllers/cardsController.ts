import type { Request, Response } from 'express';
import * as cardService from '../../../services/card.service.js';
import type { CreateCardBody } from '../../../validation/index.js';
import { ValidationError, NotFoundError } from '../../errors.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function createCardHandler(req: Request, res: Response): Promise<void> {
  const { closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday } =
    req.body as CreateCardBody;

  const card = await cardService.createCard({
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    ...(preferredWeekday !== undefined && { preferredWeekday }),
  });

  res.status(201).json(card);
}

export async function getAllCardsHandler(_req: Request, res: Response): Promise<void> {
  const cards = await cardService.listCards();
  res.json(cards);
}

export async function deleteCardHandler(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  if (!id || !UUID_REGEX.test(id)) {
    throw new ValidationError('Invalid id', { id });
  }

  const deleted = await cardService.deleteCard(id);
  if (!deleted) {
    throw new NotFoundError('Card not found', { id });
  }
  res.json({ success: true });
}
