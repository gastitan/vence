import type { Request, Response } from 'express';
import { createCard, deleteCard, getAllCards } from '../../../infrastructure/cardRepository.js';

export function createCardHandler(req: Request, res: Response): void {
  const {
    closingRangeStart,
    closingRangeEnd,
    dueOffsetDays,
    preferredWeekday,
  } = req.body as {
    closingRangeStart: number;
    closingRangeEnd: number;
    dueOffsetDays: number;
    preferredWeekday?: number;
  };

  if (
    typeof closingRangeStart !== 'number' ||
    typeof closingRangeEnd !== 'number' ||
    typeof dueOffsetDays !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

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
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  deleteCard(id);
  res.json({ success: true });
}
