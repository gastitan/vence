import { db } from './db.js';

export type CardInput = {
  closingRangeStart: number;
  closingRangeEnd: number;
  dueOffsetDays: number;
  preferredWeekday?: number;
};

export type CardRecord = CardInput & {
  id: number;
};

const insertStmt = db.prepare<[
  number,
  number,
  number,
  number | null
]>(
  `INSERT INTO cards (closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday)
   VALUES (?, ?, ?, ?)`
);

const selectAllStmt = db.prepare<CardRecord[]>(
  `SELECT id, closingRangeStart, closingRangeEnd, dueOffsetDays, preferredWeekday
   FROM cards
   ORDER BY id ASC`
);

const deleteStmt = db.prepare<[number]>(
  `DELETE FROM cards WHERE id = ?`
);

export function createCard(data: CardInput): CardRecord {
  const preferredWeekday =
    typeof data.preferredWeekday === 'number' ? data.preferredWeekday : null;

  const result = insertStmt.run(
    data.closingRangeStart,
    data.closingRangeEnd,
    data.dueOffsetDays,
    preferredWeekday
  );

  const id = Number(result.lastInsertRowid);

  return {
    id,
    closingRangeStart: data.closingRangeStart,
    closingRangeEnd: data.closingRangeEnd,
    dueOffsetDays: data.dueOffsetDays,
    ...(preferredWeekday !== null && { preferredWeekday }),
  } as CardRecord;
}

export function getAllCards(): CardRecord[] {
  const rows = selectAllStmt.all() as CardRecord[];
  return rows.map((row) => {
    const { preferredWeekday, ...rest } = row;
    if (preferredWeekday === null || preferredWeekday === undefined) {
      return rest as CardRecord;
    }
    return row;
  });
}

export function deleteCard(id: number): void {
  deleteStmt.run(id);
}

