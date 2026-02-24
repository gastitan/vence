# Vence

Vence is a financial due-date planning system that helps you track, predict, and organize recurring payments (credit cards, services, loans, installments) using **rules instead of manually entered dates**.

The core idea is simple:

> Define how something expires, not the exact date every month.

Vence is powered by **dueflow**, a deterministic rule engine that calculates upcoming due dates based on explicit rules.

---

## 🧠 Concept

Most reminder apps require you to manually enter exact dates every month.

Vence works differently:

- You define the rule behind a due date
- The system calculates future occurrences
- Estimated dates are clearly flagged
- Confidence is explicit and transparent

This allows predictable, honest, and maintainable financial planning.

---

## 🧩 Architecture

Vence follows a **backend-first, client-agnostic architecture**.

### 1️⃣ dueflow (Engine Layer)

- Pure rule engine
- Deterministic calculations
- No side effects
- No persistence
- Fully documented in `RULES.md`

```ts
calculateNextDueDate({ rule, referenceDate }) → CalculationResult
```

---

## Database (Prisma + SQLite)

The app uses **Prisma ORM** with SQLite by default. The schema is written to stay compatible with PostgreSQL when you switch.

### Setup

1. **Environment**  
   Copy `.env.example` to `.env` and set `DATABASE_URL` (default: `file:./dueflow.db`).

2. **Generate client**  
   After changing `prisma/schema.prisma`:
   ```bash
   npx prisma generate
   ```

3. **Migrations**  
   Create and apply migrations:
   ```bash
   npx prisma migrate dev --name <migration_name>
   ```
   For a fresh database, the first migration will create all tables. Connection URL is read from `prisma.config.ts` (which uses `dotenv`), so ensure `.env` is present when running Prisma CLI.

4. **Production**  
   To apply migrations in production (e.g. CI or deploy):
   ```bash
   npx prisma migrate deploy
   ```
   Ensure `DATABASE_URL` is set in the environment.