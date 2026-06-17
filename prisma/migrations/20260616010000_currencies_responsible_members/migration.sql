-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
ADD COLUMN     "exchangeRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
ADD COLUMN     "monthlyPaymentDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyPaymentOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pendingBalanceDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pendingBalanceOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "responsibleMemberId" TEXT;

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "amountBudgetedDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountBudgetedOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountQ1Original" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountQ2Original" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountType" "IncomeAmountType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
ADD COLUMN     "exchangeRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
ADD COLUMN     "responsibleMemberId" TEXT;

-- AlterTable
ALTER TABLE "ExpensePayment" ADD COLUMN     "amountDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
ADD COLUMN     "exchangeRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
ADD COLUMN     "responsibleMemberId" TEXT;

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "amountDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
ADD COLUMN     "exchangeRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
ADD COLUMN     "responsibleMemberId" TEXT;

-- AlterTable
ALTER TABLE "IncomeReceipt" ADD COLUMN     "amountDop" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "amountOriginal" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'DOP',
ADD COLUMN     "currencyId" TEXT,
ADD COLUMN     "currencySymbol" TEXT NOT NULL DEFAULT 'RD$',
ADD COLUMN     "exchangeRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
ADD COLUMN     "responsibleMemberId" TEXT;

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "defaultRateToDop" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Currency" ("id", "budgetId", "code", "name", "symbol", "defaultRateToDop", "isBase", "isActive", "updatedAt")
SELECT 'currency_dop_' || "id", "id", 'DOP', 'Peso Dominicano', 'RD$', 1, true, true, CURRENT_TIMESTAMP
FROM "Budget"
ON CONFLICT DO NOTHING;

UPDATE "Income" AS target
SET
  "currencyId" = currency."id",
  "amountOriginal" = target."amount",
  "amountDop" = target."amount"
FROM "BudgetPeriod" AS period
JOIN "Currency" AS currency ON currency."budgetId" = period."budgetId" AND currency."code" = 'DOP'
WHERE target."budgetPeriodId" = period."id";

UPDATE "IncomeReceipt" AS target
SET
  "currencyId" = currency."id",
  "amountOriginal" = target."amount",
  "amountDop" = target."amount"
FROM "BudgetPeriod" AS period
JOIN "Currency" AS currency ON currency."budgetId" = period."budgetId" AND currency."code" = 'DOP'
WHERE target."budgetPeriodId" = period."id";

UPDATE "Expense" AS target
SET
  "currencyId" = currency."id",
  "amountBudgetedOriginal" = target."amountBudgetedMonthly",
  "amountQ1Original" = target."amountQ1",
  "amountQ2Original" = target."amountQ2",
  "amountBudgetedDop" = target."amountBudgetedMonthly"
FROM "BudgetPeriod" AS period
JOIN "Currency" AS currency ON currency."budgetId" = period."budgetId" AND currency."code" = 'DOP'
WHERE target."budgetPeriodId" = period."id";

UPDATE "ExpensePayment" AS target
SET
  "currencyId" = currency."id",
  "amountOriginal" = target."amount",
  "amountDop" = target."amount"
FROM "BudgetPeriod" AS period
JOIN "Currency" AS currency ON currency."budgetId" = period."budgetId" AND currency."code" = 'DOP'
WHERE target."budgetPeriodId" = period."id";

UPDATE "Debt" AS target
SET
  "currencyId" = currency."id",
  "pendingBalanceOriginal" = target."pendingBalance",
  "monthlyPaymentOriginal" = target."monthlyPayment",
  "pendingBalanceDop" = target."pendingBalance",
  "monthlyPaymentDop" = target."monthlyPayment"
FROM "BudgetPeriod" AS period
JOIN "Currency" AS currency ON currency."budgetId" = period."budgetId" AND currency."code" = 'DOP'
WHERE target."budgetPeriodId" = period."id";

UPDATE "Income" AS target
SET "responsibleMemberId" = member."id"
FROM "BudgetPeriod" AS period
JOIN "Budget" AS budget ON budget."id" = period."budgetId"
JOIN "WorkspaceMember" AS member ON member."workspaceId" = budget."workspaceId"
JOIN "User" AS app_user ON app_user."id" = member."userId"
WHERE target."budgetPeriodId" = period."id"
  AND target."responsibleMemberId" IS NULL
  AND (
    LOWER(COALESCE(app_user."name", '')) = LOWER(target."responsibleName")
    OR LOWER(COALESCE(app_user."email", '')) = LOWER(target."responsibleName")
  );

UPDATE "IncomeReceipt" AS target
SET "responsibleMemberId" = member."id"
FROM "BudgetPeriod" AS period
JOIN "Budget" AS budget ON budget."id" = period."budgetId"
JOIN "WorkspaceMember" AS member ON member."workspaceId" = budget."workspaceId"
JOIN "User" AS app_user ON app_user."id" = member."userId"
WHERE target."budgetPeriodId" = period."id"
  AND target."responsibleMemberId" IS NULL
  AND (
    LOWER(COALESCE(app_user."name", '')) = LOWER(target."responsibleName")
    OR LOWER(COALESCE(app_user."email", '')) = LOWER(target."responsibleName")
  );

UPDATE "Expense" AS target
SET "responsibleMemberId" = member."id"
FROM "BudgetPeriod" AS period
JOIN "Budget" AS budget ON budget."id" = period."budgetId"
JOIN "WorkspaceMember" AS member ON member."workspaceId" = budget."workspaceId"
JOIN "User" AS app_user ON app_user."id" = member."userId"
WHERE target."budgetPeriodId" = period."id"
  AND target."responsibleMemberId" IS NULL
  AND (
    LOWER(COALESCE(app_user."name", '')) = LOWER(target."responsibleName")
    OR LOWER(COALESCE(app_user."email", '')) = LOWER(target."responsibleName")
  );

UPDATE "ExpensePayment" AS target
SET "responsibleMemberId" = member."id"
FROM "BudgetPeriod" AS period
JOIN "Budget" AS budget ON budget."id" = period."budgetId"
JOIN "WorkspaceMember" AS member ON member."workspaceId" = budget."workspaceId"
JOIN "User" AS app_user ON app_user."id" = member."userId"
WHERE target."budgetPeriodId" = period."id"
  AND target."responsibleMemberId" IS NULL
  AND (
    LOWER(COALESCE(app_user."name", '')) = LOWER(target."responsibleName")
    OR LOWER(COALESCE(app_user."email", '')) = LOWER(target."responsibleName")
  );

UPDATE "Debt" AS target
SET "responsibleMemberId" = member."id"
FROM "BudgetPeriod" AS period
JOIN "Budget" AS budget ON budget."id" = period."budgetId"
JOIN "WorkspaceMember" AS member ON member."workspaceId" = budget."workspaceId"
JOIN "User" AS app_user ON app_user."id" = member."userId"
WHERE target."budgetPeriodId" = period."id"
  AND target."responsibleMemberId" IS NULL
  AND (
    LOWER(COALESCE(app_user."name", '')) = LOWER(target."responsibleName")
    OR LOWER(COALESCE(app_user."email", '')) = LOWER(target."responsibleName")
  );

-- CreateIndex
CREATE INDEX "Currency_budgetId_isActive_idx" ON "Currency"("budgetId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_budgetId_code_key" ON "Currency"("budgetId", "code");

-- CreateIndex
CREATE INDEX "Debt_responsibleMemberId_idx" ON "Debt"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "Debt_currencyId_idx" ON "Debt"("currencyId");

-- CreateIndex
CREATE INDEX "Expense_responsibleMemberId_idx" ON "Expense"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "Expense_currencyId_idx" ON "Expense"("currencyId");

-- CreateIndex
CREATE INDEX "ExpensePayment_responsibleMemberId_idx" ON "ExpensePayment"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "ExpensePayment_currencyId_idx" ON "ExpensePayment"("currencyId");

-- CreateIndex
CREATE INDEX "Income_responsibleMemberId_idx" ON "Income"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "Income_currencyId_idx" ON "Income"("currencyId");

-- CreateIndex
CREATE INDEX "IncomeReceipt_responsibleMemberId_idx" ON "IncomeReceipt"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "IncomeReceipt_currencyId_idx" ON "IncomeReceipt"("currencyId");

-- AddForeignKey
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeReceipt" ADD CONSTRAINT "IncomeReceipt_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomeReceipt" ADD CONSTRAINT "IncomeReceipt_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_responsibleMemberId_fkey" FOREIGN KEY ("responsibleMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
