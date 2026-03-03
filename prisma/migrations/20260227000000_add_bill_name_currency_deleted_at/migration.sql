-- AlterTable: add name, currency, deletedAt to Bill (SaaS-ready; soft delete)
ALTER TABLE "Bill" ADD COLUMN "name" TEXT NOT NULL DEFAULT 'Credit card';
ALTER TABLE "Bill" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Bill" ADD COLUMN "deletedAt" DATETIME;
