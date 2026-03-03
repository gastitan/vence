-- AlterTable: add optional amount to Bill (for estimatedAmount on DueInstance)
ALTER TABLE "Bill" ADD COLUMN "amount" REAL;

-- CreateTable: DueInstance
CREATE TABLE "DueInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "billId" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "estimatedAmount" REAL,
    "confirmedAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DueInstance_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DueInstance_billId_dueDate_key" ON "DueInstance"("billId", "dueDate");
CREATE INDEX "DueInstance_billId_idx" ON "DueInstance"("billId");
CREATE INDEX "DueInstance_dueDate_idx" ON "DueInstance"("dueDate");
CREATE INDEX "DueInstance_status_idx" ON "DueInstance"("status");
