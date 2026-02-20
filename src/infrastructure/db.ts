import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../dueflow.db');

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    closingRangeStart INTEGER NOT NULL,
    closingRangeEnd INTEGER NOT NULL,
    dueOffsetDays INTEGER NOT NULL,
    preferredWeekday INTEGER
  )
`);

