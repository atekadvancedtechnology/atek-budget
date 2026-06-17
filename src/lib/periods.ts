import { Prisma } from "@prisma/client";

import { calculateDebtInterest, expectedIncomeByFortnight } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

export type PeriodTarget = {
  year: number;
  month: number;
};

type Tx = Prisma.TransactionClient;
type BudgetPeriodWithRecurringData = Prisma.BudgetPeriodGetPayload<{
  include: {
    incomes: true;
    expenses: true;
    debts: true;
    savingGoals: true;
  };
}>;

const periodWithRecurringDataInclude = {
  incomes: true,
  expenses: true,
  debts: true,
  savingGoals: true
} satisfies Prisma.BudgetPeriodInclude;

function normalizePeriodTarget(target: PeriodTarget) {
  if (!Number.isInteger(target.year) || target.year < 2000 || target.year > 2100) {
    throw new Error("El año del periodo no es válido.");
  }

  if (!Number.isInteger(target.month) || target.month < 1 || target.month > 12) {
    throw new Error("El mes del periodo no es válido.");
  }

  return target;
}

export function periodStartDate(period: { year: number; month: number }) {
  return new Date(Date.UTC(period.year, period.month - 1, 1));
}

function periodOrdinal(period: { year: number; month: number }) {
  return period.year * 12 + period.month;
}

function monthsBetweenPeriods(from: { year: number; month: number }, to: { year: number; month: number }) {
  return Math.max(periodOrdinal(to) - periodOrdinal(from), 1);
}

function periodIsBeforeOrSame(left: { year: number; month: number }, right: { year: number; month: number }) {
  return periodOrdinal(left) <= periodOrdinal(right);
}

function periodIsAfterOrSame(left: { year: number; month: number }, right: { year: number; month: number }) {
  return periodOrdinal(left) >= periodOrdinal(right);
}

function periodRangeWhere(from: { year: number; month: number }, to: { year: number; month: number }) {
  return {
    AND: [
      {
        OR: [
          {
            year: {
              gt: from.year
            }
          },
          {
            year: from.year,
            month: {
              gte: from.month
            }
          }
        ]
      },
      {
        OR: [
          {
            year: {
              lt: to.year
            }
          },
          {
            year: to.year,
            month: {
              lte: to.month
            }
          }
        ]
      }
    ]
  };
}

function isInheritedIncome(
  income: { amountType: string; frequency: string; isActive: boolean; endDate?: Date | null },
  period: { year: number; month: number }
) {
  return (
    income.isActive &&
    income.amountType === "FIXED" &&
    income.frequency !== "ONE_TIME" &&
    income.frequency !== "IRREGULAR" &&
    (!income.endDate || income.endDate >= periodStartDate(period))
  );
}

function isInheritedExpense(expense: { amountType: string; isRecurring: boolean; isActive: boolean }) {
  return expense.amountType === "FIXED" && expense.isRecurring && expense.isActive;
}

function isInheritedDebt(debt: { status: string; pendingBalance: Prisma.Decimal; remainingMonths: number }) {
  return debt.status === "ACTIVE" && (Number(debt.pendingBalance) > 0 || debt.remainingMonths > 0);
}

async function getPeriodWithRecurringData(tx: Tx, periodId: string) {
  return tx.budgetPeriod.findUnique({
    where: {
      id: periodId
    },
    include: periodWithRecurringDataInclude
  });
}

async function findSyncSourcePeriod(
  tx: Tx,
  budgetId: string,
  target: { year: number; month: number }
) {
  const active = await tx.budgetPeriod.findFirst({
    where: {
      budgetId,
      status: "ACTIVE",
      OR: [
        {
          year: {
            lt: target.year
          }
        },
        {
          year: target.year,
          month: {
            lte: target.month
          }
        }
      ]
    },
    include: periodWithRecurringDataInclude,
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });

  if (active) return active;

  return tx.budgetPeriod.findFirst({
    where: {
      budgetId,
      OR: [
        {
          year: {
            lt: target.year
          }
        },
        {
          year: target.year,
          month: {
            lt: target.month
          }
        }
      ]
    },
    include: periodWithRecurringDataInclude,
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });
}

async function inheritRecurringData(
  tx: Tx,
  previous: BudgetPeriodWithRecurringData,
  period: BudgetPeriodWithRecurringData,
  userId?: string
) {
  if (!periodIsBeforeOrSame(previous, period) || previous.id === period.id) return;

  const monthDelta = monthsBetweenPeriods(previous, period);
  const inheritedIncomes = previous.incomes.filter((income) => isInheritedIncome(income, period)).map((income) => {
    const calculationInput = {
      amount: income.amount,
      frequency: income.frequency,
      startDate: income.startDate,
      endDate: income.endDate,
      expectedPaymentDays: income.expectedPaymentDays,
      isActive: income.isActive
    };
    const fortnight = expectedIncomeByFortnight(calculationInput, period.year, period.month);

    return {
      budgetPeriodId: period.id,
      responsibleName: income.responsibleName,
      responsibleMemberId: income.responsibleMemberId,
      currencyId: income.currencyId,
      currencyCode: income.currencyCode,
      currencySymbol: income.currencySymbol,
      amountOriginal: income.amountOriginal,
      exchangeRateToDop: income.exchangeRateToDop,
      amountDop: income.amountDop,
      amount: income.amount,
      amountType: income.amountType,
      frequency: income.frequency,
      startDate: income.startDate,
      endDate: income.endDate,
      customRule: income.customRule,
      expectedPaymentDays: income.expectedPaymentDays,
      amountQ1: fortnight.q1,
      amountQ2: fortnight.q2,
      source: income.source,
      notes: income.notes,
      isActive: income.isActive,
      createdById: userId ?? income.createdById,
      updatedById: userId ?? income.updatedById
    };
  });

  if (inheritedIncomes.length > 0) {
    await tx.income.createMany({
      data: inheritedIncomes,
      skipDuplicates: true
    });
  }

  const inheritedExpenses = previous.expenses.filter(isInheritedExpense).map((expense) => ({
    budgetPeriodId: period.id,
    name: expense.name,
    responsibleName: expense.responsibleName,
    responsibleMemberId: expense.responsibleMemberId,
    categoryId: expense.categoryId,
    currencyId: expense.currencyId,
    currencyCode: expense.currencyCode,
    currencySymbol: expense.currencySymbol,
    amountType: expense.amountType,
    amountBudgetedOriginal: expense.amountBudgetedOriginal,
    amountQ1Original: expense.amountQ1Original,
    amountQ2Original: expense.amountQ2Original,
    exchangeRateToDop: expense.exchangeRateToDop,
    amountBudgetedDop: expense.amountBudgetedDop,
    amountBudgetedMonthly: expense.amountBudgetedMonthly,
    amountQ1: expense.amountQ1,
    amountQ2: expense.amountQ2,
    bankAccountId: expense.bankAccountId,
    actualAmount: 0,
    difference: -Number(expense.amountBudgetedMonthly),
    status: "PENDING" as const,
    expenseDate: null,
    isRecurring: expense.isRecurring,
    isActive: expense.isActive,
    notes: expense.notes,
    createdById: userId ?? expense.createdById,
    updatedById: userId ?? expense.updatedById
  }));

  if (inheritedExpenses.length > 0) {
    await tx.expense.createMany({
      data: inheritedExpenses,
      skipDuplicates: true
    });
  }

  const inheritedDebts = previous.debts
    .filter(isInheritedDebt)
    .map((debt) => {
      const nextPendingBalance = Math.max(Number(debt.pendingBalance) - Number(debt.monthlyPayment) * monthDelta, 0);
      const nextPendingBalanceOriginal = Math.max(
        Number(debt.pendingBalanceOriginal) - Number(debt.monthlyPaymentOriginal) * monthDelta,
        0
      );
      const nextRemainingMonths = Math.max(debt.remainingMonths - monthDelta, 0);
      const estimatedCloseDate = periodStartDate(period);
      estimatedCloseDate.setUTCMonth(estimatedCloseDate.getUTCMonth() + nextRemainingMonths);

      return {
        budgetPeriodId: period.id,
        name: debt.name,
        entity: debt.entity,
        responsibleName: debt.responsibleName,
        responsibleMemberId: debt.responsibleMemberId,
        currencyId: debt.currencyId,
        currencyCode: debt.currencyCode,
        currencySymbol: debt.currencySymbol,
        pendingBalanceOriginal: nextPendingBalanceOriginal,
        monthlyPaymentOriginal: debt.monthlyPaymentOriginal,
        exchangeRateToDop: debt.exchangeRateToDop,
        pendingBalanceDop: nextPendingBalance,
        monthlyPaymentDop: debt.monthlyPayment,
        pendingBalance: nextPendingBalance,
        monthlyPayment: debt.monthlyPayment,
        annualInterestRate: debt.annualInterestRate,
        remainingMonths: nextRemainingMonths,
        estimatedTotalInterest: calculateDebtInterest(nextPendingBalance, debt.annualInterestRate, nextRemainingMonths),
        strategy: debt.strategy,
        startDate: debt.startDate,
        estimatedCloseDate,
        status: "ACTIVE" as const,
        notes: debt.notes,
        createdById: userId ?? debt.createdById,
        updatedById: userId ?? debt.updatedById
      };
    })
    .filter((debt) => Number(debt.pendingBalance) > 0 || debt.remainingMonths > 0);

  if (inheritedDebts.length > 0) {
    await tx.debt.createMany({
      data: inheritedDebts,
      skipDuplicates: true
    });
  }

  const inheritedSavingGoals = previous.savingGoals.map((goal) => ({
    budgetPeriodId: period.id,
    name: goal.name,
    monthlyTarget: goal.monthlyTarget,
    contributedThisMonth: 0,
    accumulatedBalance: goal.accumulatedBalance,
    institution: goal.institution,
    priority: goal.priority,
    notes: goal.notes,
    createdById: userId ?? goal.createdById,
    updatedById: userId ?? goal.updatedById
  }));

  if (inheritedSavingGoals.length > 0) {
    await tx.savingGoal.createMany({
      data: inheritedSavingGoals,
      skipDuplicates: true
    });
  }
}

async function syncRecurringDataUpToPeriod(
  tx: Tx,
  budgetId: string,
  target: BudgetPeriodWithRecurringData,
  userId?: string
) {
  const source = await findSyncSourcePeriod(tx, budgetId, target);
  if (!source || source.id === target.id || !periodIsBeforeOrSame(source, target)) return target;

  const periods = await tx.budgetPeriod.findMany({
    where: {
      budgetId,
      ...periodRangeWhere(source, target)
    },
    include: periodWithRecurringDataInclude,
    orderBy: [{ year: "asc" }, { month: "asc" }]
  });

  let previous = periods.find((period) => period.id === source.id) ?? source;
  let refreshedTarget = target;

  for (const period of periods) {
    if (period.id === previous.id) continue;
    if (!periodIsAfterOrSame(period, previous) || periodOrdinal(period) > periodOrdinal(target)) continue;

    await inheritRecurringData(tx, previous, period, userId);
    const refreshed = await getPeriodWithRecurringData(tx, period.id);
    if (!refreshed) {
      throw new Error("No se pudo sincronizar el periodo presupuestario.");
    }

    previous = refreshed;
    if (period.id === target.id) refreshedTarget = refreshed;
  }

  return refreshedTarget;
}

export async function getOrCreateBudgetPeriod(
  tx: Tx,
  budgetId: string,
  target: PeriodTarget,
  userId?: string
) {
  const periodTarget = normalizePeriodTarget(target);
  const existing = await tx.budgetPeriod.findUnique({
    where: {
      budgetId_year_month: {
        budgetId,
        year: periodTarget.year,
        month: periodTarget.month
      }
    },
    include: periodWithRecurringDataInclude
  });

  if (existing) {
    return syncRecurringDataUpToPeriod(tx, budgetId, existing, userId);
  }

  const existingPeriods = await tx.budgetPeriod.count({
    where: {
      budgetId
    }
  });
  const period = await tx.budgetPeriod.create({
    data: {
      budgetId,
      year: periodTarget.year,
      month: periodTarget.month,
      status: existingPeriods === 0 ? "ACTIVE" : "DRAFT"
    },
    include: periodWithRecurringDataInclude
  });

  return syncRecurringDataUpToPeriod(tx, budgetId, period, userId);
}

export async function ensureBudgetPeriodWithRecurringData(
  budgetId: string,
  target: PeriodTarget,
  userId?: string
) {
  return prisma.$transaction((tx) => getOrCreateBudgetPeriod(tx, budgetId, target, userId));
}
