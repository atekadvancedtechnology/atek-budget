CREATE TABLE "ExpensePayment" (
    "id" TEXT NOT NULL,
    "budgetPeriodId" TEXT NOT NULL,
    "expenseId" TEXT,
    "name" TEXT NOT NULL,
    "responsibleName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "bankAccountId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpensePayment_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ExpensePayment" (
    "id",
    "budgetPeriodId",
    "expenseId",
    "name",
    "responsibleName",
    "categoryId",
    "bankAccountId",
    "amount",
    "paidDate",
    "notes",
    "createdById",
    "createdAt",
    "updatedAt"
)
SELECT
    'migrated_' || "id",
    "budgetPeriodId",
    "id",
    "name",
    "responsibleName",
    "categoryId",
    "bankAccountId",
    "actualAmount",
    COALESCE("expenseDate", "updatedAt", "createdAt"),
    "notes",
    "createdById",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Expense"
WHERE COALESCE("actualAmount", 0) > 0
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX "ExpensePayment_budgetPeriodId_paidDate_idx" ON "ExpensePayment"("budgetPeriodId", "paidDate");
CREATE INDEX "ExpensePayment_expenseId_idx" ON "ExpensePayment"("expenseId");
CREATE INDEX "ExpensePayment_categoryId_idx" ON "ExpensePayment"("categoryId");
CREATE INDEX "ExpensePayment_bankAccountId_idx" ON "ExpensePayment"("bankAccountId");
CREATE INDEX "ExpensePayment_createdById_idx" ON "ExpensePayment"("createdById");

ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_budgetPeriodId_fkey" FOREIGN KEY ("budgetPeriodId") REFERENCES "BudgetPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExpensePayment" ADD CONSTRAINT "ExpensePayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
