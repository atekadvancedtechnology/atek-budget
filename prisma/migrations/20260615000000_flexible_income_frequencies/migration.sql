-- CreateEnum
CREATE TYPE "IncomeAmountType" AS ENUM ('FIXED', 'VARIABLE', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "IncomeFrequency" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'IRREGULAR', 'CUSTOM');

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountType" "IncomeAmountType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "customRule" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "expectedPaymentDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "frequency" "IncomeFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill flexible-income fields from the original monthly/quincena structure.
UPDATE "Income" AS income
SET
    "amount" = income."amountMonthly",
    "startDate" = make_date(period."year", period."month", 1),
    "expectedPaymentDays" = ARRAY[15, 30]::INTEGER[]
FROM "BudgetPeriod" AS period
WHERE income."budgetPeriodId" = period."id";

-- CreateTable
CREATE TABLE "IncomeReceipt" (
    "id" TEXT NOT NULL,
    "budgetPeriodId" TEXT NOT NULL,
    "incomeId" TEXT,
    "responsibleName" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomeReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IncomeReceipt_budgetPeriodId_receivedDate_idx" ON "IncomeReceipt"("budgetPeriodId", "receivedDate");

-- CreateIndex
CREATE INDEX "IncomeReceipt_incomeId_idx" ON "IncomeReceipt"("incomeId");

-- CreateIndex
CREATE INDEX "IncomeReceipt_createdById_idx" ON "IncomeReceipt"("createdById");

-- AddForeignKey
ALTER TABLE "IncomeReceipt" ADD CONSTRAINT "IncomeReceipt_budgetPeriodId_fkey" FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeReceipt" ADD CONSTRAINT "IncomeReceipt_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeReceipt" ADD CONSTRAINT "IncomeReceipt_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
