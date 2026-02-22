import type { Request, Response } from 'express';
import { createCard, deleteCard, getAllCards } from '../../../infrastructure/cardRepository.js';
import type { CreateCardBody } from '../../../validation/index.js';
import { ValidationError, NotFoundError } from '../../errors.js';

export function createCardHandler(req: Request, res: Response): void {
  const { closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday } =
    req.body as CreateCardBody;

  const card = createCard({
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    ...(preferredWeekday !== undefined && { preferredWeekday }),
  });

  res.status(201).json(card);
}

export function getAllCardsHandler(_req: Request, res: Response): void {
  const cards = getAllCards();
  res.json(cards);
}

export function deleteCardHandler(req: Request, res: Response): void {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError('Invalid id', { id: req.params.id });
  }

  const deleted = deleteCard(id);
  if (!deleted) {
    throw new NotFoundError('Card not found', { id });
  }
  res.json({ success: true });
}
