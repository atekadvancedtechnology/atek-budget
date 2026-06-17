"use server";

import { Prisma, WorkspaceRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireBudgetRole, requireUser } from "@/lib/authorization";
import {
  bankAccountSchema,
  createBudgetSchema,
  debtSchema,
  expenseCategorySchema,
  expensePaymentSchema,
  expenseSchema,
  incomeReceiptSchema,
  incomeSchema,
  invitationSchema,
  savingGoalSchema
} from "@/lib/validations";
import {
  calculateDebtInterest,
  calculateExpenseDifference,
  calculateExpenseStatus,
  estimateMonthlyIncome,
  expectedIncomeByFortnight
} from "@/lib/finance";
import { getOrCreateBudgetPeriod as getOrCreateBudgetPeriodWithInheritance, type PeriodTarget } from "@/lib/periods";
import { prisma } from "@/lib/prisma";

const defaultCategories = [
  ["Casa", "home", 30],
  ["Vehículo", "car", 15],
  ["Comida", "utensils", 15],
  ["Préstamo", "credit-card", 20],
  ["Personal", "user", 10],
  ["Entretenimiento", "gamepad", 5],
  ["Transporte", "bus", 5],
  ["Otros", "more-horizontal", 5]
] as const;

const defaultAccounts = [
  ["Banreserva", "Banreserva", "Banco"],
  ["APAP", "APAP", "Banco / Préstamo"],
  ["QIK", "QIK", "Banco digital / Préstamo"],
  ["BSC Pricesmart", "Banco Santa Cruz", "Tarjeta de crédito"],
  ["Efectivo", "N/A", "Efectivo"]
] as const;

type Tx = Prisma.TransactionClient;
function normalizePeriodTarget(target: PeriodTarget) {
  if (!Number.isInteger(target.year) || target.year < 2000 || target.year > 2100) {
    throw new Error("El aÃ±o del periodo no es vÃ¡lido.");
  }

  if (!Number.isInteger(target.month) || target.month < 1 || target.month > 12) {
    throw new Error("El mes del periodo no es vÃ¡lido.");
  }

  return target;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getOrCreateBudgetPeriod(tx: Tx, budgetId: string, target: PeriodTarget) {
  const periodTarget = normalizePeriodTarget(target);
  const existing = await tx.budgetPeriod.findUnique({
    where: {
      budgetId_year_month: {
        budgetId,
        year: periodTarget.year,
        month: periodTarget.month
      }
    }
  });

  if (existing) return existing;

  const existingPeriods = await tx.budgetPeriod.count({
    where: {
      budgetId
    }
  });

  return tx.budgetPeriod.create({
    data: {
      budgetId,
      year: periodTarget.year,
      month: periodTarget.month,
      status: existingPeriods === 0 ? "ACTIVE" : "DRAFT"
    }
  });
}

function periodStartDate(period: { year: number; month: number }) {
  return new Date(Date.UTC(period.year, period.month - 1, 1));
}

function parsePaymentDays(value?: string) {
  if (!value?.trim()) return [];
  return value
    .split(/[,\s]+/)
    .map((day) => Number.parseInt(day, 10))
    .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31);
}

async function audit(
  tx: Tx,
  input: {
    workspaceId: string;
    userId?: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue?: Prisma.InputJsonValue | null;
    newValue?: Prisma.InputJsonValue | null;
  }
) {
  await tx.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      oldValue: input.oldValue ?? Prisma.JsonNull,
      newValue: input.newValue ?? Prisma.JsonNull
    }
  });
}

export async function createBudgetAction(raw: unknown) {
  const user = await requireUser();
  const data = createBudgetSchema.parse(raw);
  const now = new Date();

  const budget = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: data.workspaceName,
        ownerId: user.id
      }
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER"
      }
    });

    const createdBudget = await tx.budget.create({
      data: {
        workspaceId: workspace.id,
        name: data.budgetName,
        currency: "RD$",
        startDayOfMonth: 1,
        monthlySavingTarget: 0,
        savingTargetPercent: 10,
        emergencyFundTarget: 0,
        emergencyFundCurrent: 0
      }
    });

    await tx.budgetPeriod.create({
      data: {
        budgetId: createdBudget.id,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        status: "ACTIVE"
      }
    });

    await tx.expenseCategory.createMany({
      data: defaultCategories.map(([name, icon, recommendedMaxPercent]) => ({
        budgetId: createdBudget.id,
        name,
        icon,
        recommendedMaxPercent,
        isDefault: true
      }))
    });

    await tx.bankAccount.createMany({
      data: defaultAccounts.map(([name, institution, type]) => ({
        budgetId: createdBudget.id,
        name,
        institution,
        type
      }))
    });

    await audit(tx, {
      workspaceId: workspace.id,
      userId: user.id,
      entityType: "Workspace",
      entityId: workspace.id,
      action: "CREATE_WORKSPACE",
      newValue: { name: workspace.name }
    });

    await audit(tx, {
      workspaceId: workspace.id,
      userId: user.id,
      entityType: "Budget",
      entityId: createdBudget.id,
      action: "CREATE_BUDGET",
      newValue: { name: createdBudget.name }
    });

    return createdBudget;
  });

  revalidatePath("/app");
  redirect(`/app/budgets/${budget.id}/dashboard`);
}

export async function deleteBudgetAction(budgetId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.budget.findUnique({
      where: {
        id: budgetId
      },
      include: {
        _count: {
          select: {
            bankAccounts: true,
            categories: true,
            periods: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontrÃ³ el presupuesto.");
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Budget",
      entityId: existing.id,
      action: "DELETE_BUDGET",
      oldValue: {
        name: existing.name,
        workspaceId: existing.workspaceId,
        periods: existing._count.periods,
        categories: existing._count.categories,
        bankAccounts: existing._count.bankAccounts
      }
    });

    await tx.budget.delete({
      where: {
        id: existing.id
      }
    });
  });

  revalidatePath("/app");
  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function createIncomeAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = incomeSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    const expectedPaymentDays = parsePaymentDays(data.expectedPaymentDays);
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const incomeForCalculation = {
      amount: data.amount,
      frequency: data.frequency,
      startDate,
      endDate,
      expectedPaymentDays,
      isActive: data.isActive
    };
    const amountMonthly = estimateMonthlyIncome(incomeForCalculation);
    const fortnight = expectedIncomeByFortnight(incomeForCalculation, period.year, period.month);
    const income = await tx.income.create({
      data: {
        responsibleName: data.responsibleName,
        source: data.source,
        amount: data.amount,
        amountType: data.amountType,
        frequency: data.frequency,
        startDate,
        endDate,
        customRule: data.customRule,
        expectedPaymentDays,
        amountMonthly,
        amountQ1: fortnight.q1,
        amountQ2: fortnight.q2,
        notes: data.notes,
        budgetPeriodId: period.id,
        createdById: access.user.id,
        updatedById: access.user.id,
        isActive: data.isActive
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Income",
      entityId: income.id,
      action: "CREATE_INCOME",
      newValue: {
        responsibleName: income.responsibleName,
        amount: Number(data.amount),
        amountType: income.amountType,
        frequency: income.frequency,
        source: income.source
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function updateIncomeAction(budgetId: string, incomeId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = incomeSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.income.findFirst({
      where: {
        id: incomeId,
        budgetPeriod: {
          budgetId
        }
      },
      include: {
        budgetPeriod: true
      }
    });

    if (!existing) {
      throw new Error("No se encontró el ingreso en este presupuesto.");
    }

    const expectedPaymentDays = parsePaymentDays(data.expectedPaymentDays);
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    const incomeForCalculation = {
      amount: data.amount,
      frequency: data.frequency,
      startDate,
      endDate,
      expectedPaymentDays,
      isActive: data.isActive
    };
    const amountMonthly = estimateMonthlyIncome(incomeForCalculation);
    const fortnight = expectedIncomeByFortnight(incomeForCalculation, existing.budgetPeriod.year, existing.budgetPeriod.month);
    const income = await tx.income.update({
      where: {
        id: existing.id
      },
      data: {
        responsibleName: data.responsibleName,
        source: data.source,
        amount: data.amount,
        amountType: data.amountType,
        frequency: data.frequency,
        startDate,
        endDate,
        customRule: data.customRule,
        expectedPaymentDays,
        amountMonthly,
        amountQ1: fortnight.q1,
        amountQ2: fortnight.q2,
        notes: data.notes,
        updatedById: access.user.id,
        isActive: data.isActive
      }
    });

    if (existing.responsibleName !== income.responsibleName || existing.source !== income.source) {
      await tx.incomeReceipt.updateMany({
        where: {
          incomeId: income.id
        },
        data: {
          responsibleName: income.responsibleName,
          source: income.source
        }
      });
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Income",
      entityId: income.id,
      action: "UPDATE_INCOME",
      oldValue: {
        responsibleName: existing.responsibleName,
        source: existing.source,
        amount: Number(existing.amount),
        amountType: existing.amountType,
        frequency: existing.frequency,
        isActive: existing.isActive
      },
      newValue: {
        responsibleName: income.responsibleName,
        source: income.source,
        amount: Number(income.amount),
        amountType: income.amountType,
        frequency: income.frequency,
        isActive: income.isActive
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/income`);
}

export async function deleteIncomeAction(budgetId: string, incomeId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.income.findFirst({
      where: {
        id: incomeId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró el ingreso en este presupuesto.");
    }

    await tx.income.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Income",
      entityId: existing.id,
      action: "DELETE_INCOME",
      oldValue: {
        responsibleName: existing.responsibleName,
        source: existing.source,
        amount: Number(existing.amount),
        frequency: existing.frequency
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/income`);
}

export async function createIncomeReceiptAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = incomeReceiptSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    let linkedIncome: { id: string; responsibleName: string; source: string } | null = null;

    if (data.incomeId) {
      linkedIncome = await tx.income.findFirst({
        where: {
          id: data.incomeId,
          budgetPeriodId: period.id
        },
        select: {
          id: true,
          responsibleName: true,
          source: true
        }
      });

      if (!linkedIncome) {
        throw new Error("El ingreso planificado seleccionado no pertenece al periodo seleccionado.");
      }
    }

    const receipt = await tx.incomeReceipt.create({
      data: {
        budgetPeriodId: period.id,
        incomeId: linkedIncome?.id ?? null,
        responsibleName: linkedIncome?.responsibleName ?? data.responsibleName,
        source: linkedIncome?.source ?? data.source,
        amount: data.amount,
        receivedDate: new Date(data.receivedDate),
        notes: data.notes,
        createdById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "IncomeReceipt",
      entityId: receipt.id,
      action: "CREATE_INCOME_RECEIPT",
      newValue: {
        responsibleName: receipt.responsibleName,
        source: receipt.source,
        amount: Number(data.amount),
        receivedDate: data.receivedDate
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function updateIncomeReceiptAction(budgetId: string, receiptId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = incomeReceiptSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.incomeReceipt.findFirst({
      where: {
        id: receiptId,
        budgetPeriod: {
          budgetId
        }
      },
      include: {
        budgetPeriod: true
      }
    });

    if (!existing) {
      throw new Error("No se encontró el ingreso recibido en este presupuesto.");
    }

    let linkedIncome: { id: string; responsibleName: string; source: string } | null = null;

    if (data.incomeId) {
      linkedIncome = await tx.income.findFirst({
        where: {
          id: data.incomeId,
          budgetPeriodId: existing.budgetPeriodId
        },
        select: {
          id: true,
          responsibleName: true,
          source: true
        }
      });

      if (!linkedIncome) {
        throw new Error("El ingreso planificado seleccionado no pertenece al periodo del ingreso recibido.");
      }
    }

    const receipt = await tx.incomeReceipt.update({
      where: {
        id: existing.id
      },
      data: {
        incomeId: linkedIncome?.id ?? null,
        responsibleName: linkedIncome?.responsibleName ?? data.responsibleName,
        source: linkedIncome?.source ?? data.source,
        amount: data.amount,
        receivedDate: new Date(data.receivedDate),
        notes: data.notes
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "IncomeReceipt",
      entityId: receipt.id,
      action: "UPDATE_INCOME_RECEIPT",
      oldValue: {
        responsibleName: existing.responsibleName,
        source: existing.source,
        amount: Number(existing.amount),
        receivedDate: existing.receivedDate.toISOString()
      },
      newValue: {
        responsibleName: receipt.responsibleName,
        source: receipt.source,
        amount: Number(receipt.amount),
        receivedDate: receipt.receivedDate.toISOString()
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/income`);
}

export async function deleteIncomeReceiptAction(budgetId: string, receiptId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.incomeReceipt.findFirst({
      where: {
        id: receiptId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró el ingreso recibido en este presupuesto.");
    }

    await tx.incomeReceipt.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "IncomeReceipt",
      entityId: existing.id,
      action: "DELETE_INCOME_RECEIPT",
      oldValue: {
        responsibleName: existing.responsibleName,
        source: existing.source,
        amount: Number(existing.amount),
        receivedDate: existing.receivedDate.toISOString()
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/income`);
}

function revalidateBudgetCategoryPaths(budgetId: string) {
  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/settings`);
  revalidatePath(`/app/budgets/${budgetId}/expenses`);
  revalidatePath(`/app/budgets/${budgetId}/dashboard`);
}

function revalidateBudgetAccountPaths(budgetId: string) {
  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/settings`);
  revalidatePath(`/app/budgets/${budgetId}/expenses`);
  revalidatePath(`/app/budgets/${budgetId}/dashboard`);
  revalidatePath(`/app/budgets/${budgetId}/cashflow`);
  revalidatePath(`/app/budgets/${budgetId}/history`);
}

function revalidateBudgetExpensePaths(budgetId: string) {
  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/expenses`);
  revalidatePath(`/app/budgets/${budgetId}/dashboard`);
  revalidatePath(`/app/budgets/${budgetId}/cashflow`);
  revalidatePath(`/app/budgets/${budgetId}/history`);
}

async function updateExpenseActualFromPayments(tx: Tx, expenseId: string) {
  const expense = await tx.expense.findUnique({
    where: {
      id: expenseId
    },
    select: {
      id: true,
      amountBudgetedMonthly: true
    }
  });

  if (!expense) return;

  const paymentTotal = await tx.expensePayment.aggregate({
    where: {
      expenseId
    },
    _sum: {
      amount: true
    }
  });
  const actualAmount = Number(paymentTotal._sum.amount ?? 0);

  await tx.expense.update({
    where: {
      id: expense.id
    },
    data: {
      actualAmount,
      difference: calculateExpenseDifference(actualAmount, expense.amountBudgetedMonthly),
      status: calculateExpenseStatus(actualAmount, expense.amountBudgetedMonthly)
    }
  });
}

export async function createExpenseCategoryAction(budgetId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expenseCategorySchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const duplicate = await tx.expenseCategory.findFirst({
      where: {
        budgetId,
        name: data.name
      }
    });

    if (duplicate) {
      throw new Error("Ya existe una categoría con ese nombre en este presupuesto.");
    }

    const category = await tx.expenseCategory.create({
      data: {
        budgetId,
        name: data.name,
        icon: data.icon || null,
        recommendedMaxPercent: data.recommendedMaxPercent,
        isDefault: false
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpenseCategory",
      entityId: category.id,
      action: "CREATE_EXPENSE_CATEGORY",
      newValue: {
        name: category.name,
        icon: category.icon,
        recommendedMaxPercent: Number(category.recommendedMaxPercent)
      }
    });
  });

  revalidateBudgetCategoryPaths(budgetId);
}

export async function updateExpenseCategoryAction(budgetId: string, categoryId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expenseCategorySchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expenseCategory.findFirst({
      where: {
        id: categoryId,
        budgetId
      }
    });

    if (!existing) {
      throw new Error("No se encontró la categoría en este presupuesto.");
    }

    const duplicate = await tx.expenseCategory.findFirst({
      where: {
        budgetId,
        name: data.name,
        NOT: {
          id: existing.id
        }
      }
    });

    if (duplicate) {
      throw new Error("Ya existe otra categoría con ese nombre en este presupuesto.");
    }

    const category = await tx.expenseCategory.update({
      where: {
        id: existing.id
      },
      data: {
        name: data.name,
        icon: data.icon || null,
        recommendedMaxPercent: data.recommendedMaxPercent
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpenseCategory",
      entityId: category.id,
      action: "UPDATE_EXPENSE_CATEGORY",
      oldValue: {
        name: existing.name,
        icon: existing.icon,
        recommendedMaxPercent: Number(existing.recommendedMaxPercent)
      },
      newValue: {
        name: category.name,
        icon: category.icon,
        recommendedMaxPercent: Number(category.recommendedMaxPercent)
      }
    });
  });

  revalidateBudgetCategoryPaths(budgetId);
}

export async function deleteExpenseCategoryAction(budgetId: string, categoryId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expenseCategory.findFirst({
      where: {
        id: categoryId,
        budgetId
      },
      include: {
        _count: {
          select: {
            expenses: true,
            expensePayments: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró la categoría en este presupuesto.");
    }

    if (existing._count.expenses > 0 || existing._count.expensePayments > 0) {
      throw new Error("No puedes eliminar una categoría que ya tiene gastos registrados. Puedes editar su nombre para reutilizarla.");
    }

    await tx.expenseCategory.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpenseCategory",
      entityId: existing.id,
      action: "DELETE_EXPENSE_CATEGORY",
      oldValue: {
        name: existing.name,
        icon: existing.icon,
        recommendedMaxPercent: Number(existing.recommendedMaxPercent)
      }
    });
  });

  revalidateBudgetCategoryPaths(budgetId);
}

export async function createBankAccountAction(budgetId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = bankAccountSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const duplicate = await tx.bankAccount.findFirst({
      where: {
        budgetId,
        name: data.name
      }
    });

    if (duplicate) {
      throw new Error("Ya existe una cuenta con ese nombre en este presupuesto.");
    }

    const account = await tx.bankAccount.create({
      data: {
        budgetId,
        name: data.name,
        institution: data.institution,
        type: data.type,
        notes: data.notes || null
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "BankAccount",
      entityId: account.id,
      action: "CREATE_BANK_ACCOUNT",
      newValue: {
        name: account.name,
        institution: account.institution,
        type: account.type,
        notes: account.notes
      }
    });
  });

  revalidateBudgetAccountPaths(budgetId);
}

export async function updateBankAccountAction(budgetId: string, accountId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = bankAccountSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.bankAccount.findFirst({
      where: {
        id: accountId,
        budgetId
      }
    });

    if (!existing) {
      throw new Error("No se encontro la cuenta en este presupuesto.");
    }

    const duplicate = await tx.bankAccount.findFirst({
      where: {
        budgetId,
        name: data.name,
        NOT: {
          id: existing.id
        }
      }
    });

    if (duplicate) {
      throw new Error("Ya existe otra cuenta con ese nombre en este presupuesto.");
    }

    const account = await tx.bankAccount.update({
      where: {
        id: existing.id
      },
      data: {
        name: data.name,
        institution: data.institution,
        type: data.type,
        notes: data.notes || null
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "BankAccount",
      entityId: account.id,
      action: "UPDATE_BANK_ACCOUNT",
      oldValue: {
        name: existing.name,
        institution: existing.institution,
        type: existing.type,
        notes: existing.notes
      },
      newValue: {
        name: account.name,
        institution: account.institution,
        type: account.type,
        notes: account.notes
      }
    });
  });

  revalidateBudgetAccountPaths(budgetId);
}

export async function deleteBankAccountAction(budgetId: string, accountId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.bankAccount.findFirst({
      where: {
        id: accountId,
        budgetId
      },
      include: {
        _count: {
          select: {
            expenses: true,
            expensePayments: true
          }
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontro la cuenta en este presupuesto.");
    }

    if (existing._count.expenses > 0 || existing._count.expensePayments > 0) {
      throw new Error(
        "No puedes eliminar una cuenta que ya tiene gastos o pagos registrados. Puedes editar su nombre para reutilizarla."
      );
    }

    await tx.bankAccount.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "BankAccount",
      entityId: existing.id,
      action: "DELETE_BANK_ACCOUNT",
      oldValue: {
        name: existing.name,
        institution: existing.institution,
        type: existing.type,
        notes: existing.notes
      }
    });
  });

  revalidateBudgetAccountPaths(budgetId);
}

export async function createExpenseAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expenseSchema.parse(raw);
  const actualAmount = data.actualAmount ?? 0;
  const status = calculateExpenseStatus(actualAmount, data.amountBudgetedMonthly);
  const difference = calculateExpenseDifference(actualAmount, data.amountBudgetedMonthly);

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    const expense = await tx.expense.create({
      data: {
        name: data.name,
        responsibleName: data.responsibleName,
        categoryId: data.categoryId,
        amountBudgetedMonthly: data.amountBudgetedMonthly,
        amountQ1: data.amountQ1,
        amountQ2: data.amountQ2,
        bankAccountId: data.bankAccountId || null,
        actualAmount,
        difference,
        status,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : null,
        isRecurring: data.isRecurring,
        isActive: true,
        notes: data.notes,
        budgetPeriodId: period.id,
        createdById: access.user.id,
        updatedById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Expense",
      entityId: expense.id,
      action: "CREATE_EXPENSE",
      newValue: {
        name: expense.name,
        amountBudgetedMonthly: Number(data.amountBudgetedMonthly),
        actualAmount: Number(actualAmount),
        status
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function updateExpenseAction(budgetId: string, expenseId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expenseSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({
      where: {
        id: expenseId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró el gasto en este presupuesto.");
    }

    const paymentTotal = await tx.expensePayment.aggregate({
      where: {
        expenseId: existing.id
      },
      _sum: {
        amount: true
      },
      _count: true
    });
    const actualAmount = paymentTotal._count > 0
      ? Number(paymentTotal._sum.amount ?? 0)
      : data.actualAmount ?? Number(existing.actualAmount ?? 0);
    const status = calculateExpenseStatus(actualAmount, data.amountBudgetedMonthly);
    const difference = calculateExpenseDifference(actualAmount, data.amountBudgetedMonthly);

    const expense = await tx.expense.update({
      where: {
        id: existing.id
      },
      data: {
        name: data.name,
        responsibleName: data.responsibleName,
        categoryId: data.categoryId,
        amountBudgetedMonthly: data.amountBudgetedMonthly,
        amountQ1: data.amountQ1,
        amountQ2: data.amountQ2,
        bankAccountId: data.bankAccountId || null,
        actualAmount,
        difference,
        status,
        expenseDate: data.expenseDate ? new Date(data.expenseDate) : null,
        isRecurring: data.isRecurring,
        notes: data.notes,
        updatedById: access.user.id
      }
    });

    if (
      existing.name !== expense.name ||
      existing.responsibleName !== expense.responsibleName ||
      existing.categoryId !== expense.categoryId ||
      existing.bankAccountId !== expense.bankAccountId
    ) {
      await tx.expensePayment.updateMany({
        where: {
          expenseId: expense.id
        },
        data: {
          name: expense.name,
          responsibleName: expense.responsibleName,
          categoryId: expense.categoryId,
          bankAccountId: expense.bankAccountId
        }
      });
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Expense",
      entityId: expense.id,
      action: "UPDATE_EXPENSE",
      oldValue: {
        name: existing.name,
        amountBudgetedMonthly: Number(existing.amountBudgetedMonthly),
        actualAmount: Number(existing.actualAmount),
        status: existing.status
      },
      newValue: {
        name: expense.name,
        amountBudgetedMonthly: Number(expense.amountBudgetedMonthly),
        actualAmount: Number(expense.actualAmount),
        status: expense.status
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/expenses`);
}

export async function deleteExpenseAction(budgetId: string, expenseId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expense.findFirst({
      where: {
        id: expenseId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró el gasto en este presupuesto.");
    }

    await tx.expense.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Expense",
      entityId: existing.id,
      action: "DELETE_EXPENSE",
      oldValue: {
        name: existing.name,
        amountBudgetedMonthly: Number(existing.amountBudgetedMonthly),
        actualAmount: Number(existing.actualAmount)
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/expenses`);
}

function assertDateInPeriod(date: Date, period: { year: number; month: number }) {
  if (date.getUTCFullYear() !== period.year || date.getUTCMonth() + 1 !== period.month) {
    throw new Error("La fecha del pago debe pertenecer al periodo seleccionado.");
  }
}

export async function createExpensePaymentAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expensePaymentSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    const paidDate = new Date(data.paidDate);
    assertDateInPeriod(paidDate, period);
    let linkedExpense: {
      id: string;
      name: string;
      responsibleName: string;
      categoryId: string;
      bankAccountId: string | null;
    } | null = null;

    if (data.expenseId) {
      linkedExpense = await tx.expense.findFirst({
        where: {
          id: data.expenseId,
          budgetPeriodId: period.id
        },
        select: {
          id: true,
          name: true,
          responsibleName: true,
          categoryId: true,
          bankAccountId: true
        }
      });

      if (!linkedExpense) {
        throw new Error("El gasto planificado seleccionado no pertenece al periodo seleccionado.");
      }
    } else {
      const category = await tx.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          budgetId
        }
      });

      if (!category) {
        throw new Error("La categoría seleccionada no pertenece a este presupuesto.");
      }

      if (data.bankAccountId) {
        const account = await tx.bankAccount.findFirst({
          where: {
            id: data.bankAccountId,
            budgetId
          }
        });

        if (!account) {
          throw new Error("La cuenta seleccionada no pertenece a este presupuesto.");
        }
      }
    }

    const payment = await tx.expensePayment.create({
      data: {
        budgetPeriodId: period.id,
        expenseId: linkedExpense?.id ?? null,
        name: linkedExpense?.name ?? data.name,
        responsibleName: linkedExpense?.responsibleName ?? data.responsibleName,
        categoryId: linkedExpense?.categoryId ?? data.categoryId,
        bankAccountId: (linkedExpense?.bankAccountId ?? data.bankAccountId) || null,
        amount: data.amount,
        paidDate,
        notes: data.notes,
        createdById: access.user.id
      }
    });

    if (linkedExpense) {
      await updateExpenseActualFromPayments(tx, linkedExpense.id);
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpensePayment",
      entityId: payment.id,
      action: "CREATE_EXPENSE_PAYMENT",
      newValue: {
        expenseId: payment.expenseId,
        name: payment.name,
        amount: Number(payment.amount),
        paidDate: payment.paidDate.toISOString()
      }
    });
  });

  revalidateBudgetExpensePaths(budgetId);
}

export async function updateExpensePaymentAction(budgetId: string, paymentId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = expensePaymentSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expensePayment.findFirst({
      where: {
        id: paymentId,
        budgetPeriod: {
          budgetId
        }
      },
      include: {
        budgetPeriod: true
      }
    });

    if (!existing) {
      throw new Error("No se encontró el pago de gasto en este presupuesto.");
    }

    const paidDate = new Date(data.paidDate);
    assertDateInPeriod(paidDate, existing.budgetPeriod);
    let linkedExpense: {
      id: string;
      name: string;
      responsibleName: string;
      categoryId: string;
      bankAccountId: string | null;
    } | null = null;

    if (data.expenseId) {
      linkedExpense = await tx.expense.findFirst({
        where: {
          id: data.expenseId,
          budgetPeriodId: existing.budgetPeriodId
        },
        select: {
          id: true,
          name: true,
          responsibleName: true,
          categoryId: true,
          bankAccountId: true
        }
      });

      if (!linkedExpense) {
        throw new Error("El gasto planificado seleccionado no pertenece al periodo del pago.");
      }
    } else {
      const category = await tx.expenseCategory.findFirst({
        where: {
          id: data.categoryId,
          budgetId
        }
      });

      if (!category) {
        throw new Error("La categoría seleccionada no pertenece a este presupuesto.");
      }

      if (data.bankAccountId) {
        const account = await tx.bankAccount.findFirst({
          where: {
            id: data.bankAccountId,
            budgetId
          }
        });

        if (!account) {
          throw new Error("La cuenta seleccionada no pertenece a este presupuesto.");
        }
      }
    }

    const payment = await tx.expensePayment.update({
      where: {
        id: existing.id
      },
      data: {
        expenseId: linkedExpense?.id ?? null,
        name: linkedExpense?.name ?? data.name,
        responsibleName: linkedExpense?.responsibleName ?? data.responsibleName,
        categoryId: linkedExpense?.categoryId ?? data.categoryId,
        bankAccountId: (linkedExpense?.bankAccountId ?? data.bankAccountId) || null,
        amount: data.amount,
        paidDate,
        notes: data.notes
      }
    });

    const expenseIdsToRefresh = new Set(
      [existing.expenseId, payment.expenseId].filter((expenseId): expenseId is string => Boolean(expenseId))
    );
    for (const expenseIdToRefresh of expenseIdsToRefresh) {
      await updateExpenseActualFromPayments(tx, expenseIdToRefresh);
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpensePayment",
      entityId: payment.id,
      action: "UPDATE_EXPENSE_PAYMENT",
      oldValue: {
        expenseId: existing.expenseId,
        name: existing.name,
        amount: Number(existing.amount),
        paidDate: existing.paidDate.toISOString()
      },
      newValue: {
        expenseId: payment.expenseId,
        name: payment.name,
        amount: Number(payment.amount),
        paidDate: payment.paidDate.toISOString()
      }
    });
  });

  revalidateBudgetExpensePaths(budgetId);
}

export async function deleteExpensePaymentAction(budgetId: string, paymentId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.expensePayment.findFirst({
      where: {
        id: paymentId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró el pago de gasto en este presupuesto.");
    }

    await tx.expensePayment.delete({
      where: {
        id: existing.id
      }
    });

    if (existing.expenseId) {
      await updateExpenseActualFromPayments(tx, existing.expenseId);
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "ExpensePayment",
      entityId: existing.id,
      action: "DELETE_EXPENSE_PAYMENT",
      oldValue: {
        expenseId: existing.expenseId,
        name: existing.name,
        amount: Number(existing.amount),
        paidDate: existing.paidDate.toISOString()
      }
    });
  });

  revalidateBudgetExpensePaths(budgetId);
}

export async function createDebtAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = debtSchema.parse(raw);
  const estimatedTotalInterest = calculateDebtInterest(
    data.pendingBalance,
    data.annualInterestRate,
    data.remainingMonths
  );

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    const estimatedCloseDate = periodStartDate(period);
    estimatedCloseDate.setUTCMonth(estimatedCloseDate.getUTCMonth() + data.remainingMonths);
    const debt = await tx.debt.create({
      data: {
        ...data,
        estimatedTotalInterest,
        estimatedCloseDate,
        startDate: periodStartDate(period),
        status: "ACTIVE",
        budgetPeriodId: period.id,
        createdById: access.user.id,
        updatedById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Debt",
      entityId: debt.id,
      action: "CREATE_DEBT",
      newValue: {
        name: debt.name,
        entity: debt.entity,
        pendingBalance: Number(data.pendingBalance)
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function updateDebtAction(budgetId: string, debtId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = debtSchema.parse(raw);
  const estimatedTotalInterest = calculateDebtInterest(
    data.pendingBalance,
    data.annualInterestRate,
    data.remainingMonths
  );

  await prisma.$transaction(async (tx) => {
    const existing = await tx.debt.findFirst({
      where: {
        id: debtId,
        budgetPeriod: {
          budgetId
        }
      },
      include: {
        budgetPeriod: true
      }
    });

    if (!existing) {
      throw new Error("No se encontró la deuda en este presupuesto.");
    }

    const estimatedCloseDate = periodStartDate(existing.budgetPeriod);
    estimatedCloseDate.setUTCMonth(estimatedCloseDate.getUTCMonth() + data.remainingMonths);
    const debt = await tx.debt.update({
      where: {
        id: existing.id
      },
      data: {
        ...data,
        estimatedTotalInterest,
        estimatedCloseDate,
        updatedById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Debt",
      entityId: debt.id,
      action: "UPDATE_DEBT",
      oldValue: {
        name: existing.name,
        pendingBalance: Number(existing.pendingBalance),
        monthlyPayment: Number(existing.monthlyPayment),
        status: existing.status
      },
      newValue: {
        name: debt.name,
        pendingBalance: Number(debt.pendingBalance),
        monthlyPayment: Number(debt.monthlyPayment),
        status: debt.status
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/debts`);
}

export async function deleteDebtAction(budgetId: string, debtId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.debt.findFirst({
      where: {
        id: debtId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró la deuda en este presupuesto.");
    }

    await tx.debt.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Debt",
      entityId: existing.id,
      action: "DELETE_DEBT",
      oldValue: {
        name: existing.name,
        pendingBalance: Number(existing.pendingBalance),
        monthlyPayment: Number(existing.monthlyPayment),
        status: existing.status
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/debts`);
}

export async function markDebtPaidAction(budgetId: string, debtId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.debt.findFirst({
      where: {
        id: debtId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró la deuda en este presupuesto.");
    }

    const debt = await tx.debt.update({
      where: {
        id: existing.id
      },
      data: {
        status: "PAID",
        updatedById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Debt",
      entityId: debt.id,
      action: "UPDATE_DEBT",
      newValue: {
        status: debt.status
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}/debts`);
}

export async function createSavingGoalAction(budgetId: string, periodTarget: PeriodTarget, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = savingGoalSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const period = await getOrCreateBudgetPeriodWithInheritance(tx, budgetId, periodTarget, access.user.id);
    const goal = await tx.savingGoal.create({
      data: {
        ...data,
        budgetPeriodId: period.id,
        createdById: access.user.id,
        updatedById: access.user.id
      }
    });

    if (data.contributedThisMonth > 0) {
      await tx.savingContribution.create({
        data: {
          savingGoalId: goal.id,
          amount: data.contributedThisMonth,
          contributionDate: new Date(),
          notes: "Aporte inicial del mes",
          createdById: access.user.id
        }
      });
    }

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "SavingGoal",
      entityId: goal.id,
      action: "CREATE_SAVING_GOAL",
      newValue: {
        name: goal.name,
        monthlyTarget: Number(data.monthlyTarget),
        contributedThisMonth: Number(data.contributedThisMonth)
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
}

export async function updateSavingGoalAction(budgetId: string, goalId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);
  const data = savingGoalSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.savingGoal.findFirst({
      where: {
        id: goalId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró la meta de ahorro en este presupuesto.");
    }

    const goal = await tx.savingGoal.update({
      where: {
        id: existing.id
      },
      data: {
        ...data,
        updatedById: access.user.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "SavingGoal",
      entityId: goal.id,
      action: "UPDATE_SAVING_GOAL",
      oldValue: {
        name: existing.name,
        monthlyTarget: Number(existing.monthlyTarget),
        contributedThisMonth: Number(existing.contributedThisMonth)
      },
      newValue: {
        name: goal.name,
        monthlyTarget: Number(goal.monthlyTarget),
        contributedThisMonth: Number(goal.contributedThisMonth)
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/savings`);
}

export async function deleteSavingGoalAction(budgetId: string, goalId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.savingGoal.findFirst({
      where: {
        id: goalId,
        budgetPeriod: {
          budgetId
        }
      }
    });

    if (!existing) {
      throw new Error("No se encontró la meta de ahorro en este presupuesto.");
    }

    await tx.savingGoal.delete({
      where: {
        id: existing.id
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "SavingGoal",
      entityId: existing.id,
      action: "DELETE_SAVING_GOAL",
      oldValue: {
        name: existing.name,
        monthlyTarget: Number(existing.monthlyTarget),
        contributedThisMonth: Number(existing.contributedThisMonth)
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}`);
  revalidatePath(`/app/budgets/${budgetId}/savings`);
}

export async function inviteMemberAction(budgetId: string, raw: unknown) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER]);
  const data = invitationSchema.parse(raw);
  const email = data.email.toLowerCase();
  const now = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: {
        workspaceId: access.budget.workspaceId,
        email,
        status: "PENDING",
        expiresAt: {
          lt: now
        }
      },
      data: {
        status: "EXPIRED"
      }
    });

    const existingMember = await tx.workspaceMember.findFirst({
      where: {
        workspaceId: access.budget.workspaceId,
        user: {
          email
        }
      }
    });

    if (existingMember) {
      throw new Error("Ese correo ya es miembro de este workspace.");
    }

    const pendingInvitation = await tx.invitation.findFirst({
      where: {
        workspaceId: access.budget.workspaceId,
        email,
        status: "PENDING",
        expiresAt: {
          gte: now
        }
      }
    });

    if (pendingInvitation) {
      throw new Error("Ya existe una invitacion pendiente para ese correo. Copia el link desde la lista de invitaciones.");
    }

    const invitation = await tx.invitation.create({
      data: {
        workspaceId: access.budget.workspaceId,
        email,
        role: data.role,
        token: crypto.randomUUID(),
        status: "PENDING",
        invitedById: access.user.id,
        expiresAt
      }
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "Invitation",
      entityId: invitation.id,
      action: "INVITE_MEMBER",
      newValue: {
        email: invitation.email,
        role: invitation.role
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}/settings`);
}

export async function acceptInvitationAction(token: string) {
  const user = await requireUser();
  if (!user.email) {
    throw new Error("Tu cuenta de Google no tiene correo disponible.");
  }

  const email = user.email.toLowerCase();
  const now = new Date();

  const destinationBudgetId = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({
      where: {
        token
      },
      include: {
        workspace: {
          include: {
            budgets: {
              orderBy: {
                createdAt: "asc"
              },
              select: {
                id: true
              },
              take: 1
            }
          }
        }
      }
    });

    if (!invitation) {
      throw new Error("No se encontro esta invitacion.");
    }

    if (invitation.email.toLowerCase() !== email) {
      throw new Error(`Esta invitacion es para ${invitation.email}. Inicia sesion con ese correo para aceptarla.`);
    }

    if (invitation.status === "CANCELLED") {
      throw new Error("Esta invitacion fue cancelada.");
    }

    if (invitation.status === "EXPIRED" || (invitation.status === "PENDING" && invitation.expiresAt < now)) {
      if (invitation.status === "PENDING") {
        await tx.invitation.update({
          where: {
            id: invitation.id
          },
          data: {
            status: "EXPIRED"
          }
        });
      }
      throw new Error("Esta invitacion expiro. Pide que te envien una nueva.");
    }

    const existingMember = await tx.workspaceMember.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        OR: [
          {
            userId: user.id
          },
          {
            user: {
              email
            }
          }
        ]
      }
    });

    if (!existingMember) {
      await tx.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          role: invitation.role
        }
      });
    }

    if (invitation.status !== "ACCEPTED") {
      await tx.invitation.update({
        where: {
          id: invitation.id
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: now
        }
      });

      await audit(tx, {
        workspaceId: invitation.workspaceId,
        userId: user.id,
        entityType: "Invitation",
        entityId: invitation.id,
        action: "ACCEPT_INVITATION",
        oldValue: {
          status: invitation.status
        },
        newValue: {
          email: invitation.email,
          role: invitation.role,
          status: "ACCEPTED"
        }
      });
    }

    return invitation.workspace.budgets[0]?.id;
  });

  revalidatePath("/app");
  if (destinationBudgetId) {
    revalidatePath(`/app/budgets/${destinationBudgetId}/settings`);
    redirect(`/app/budgets/${destinationBudgetId}/dashboard`);
  }
  redirect("/app");
}

export async function copyNextPeriodAction(budgetId: string) {
  const access = await requireBudgetRole(budgetId, [WorkspaceRole.OWNER, WorkspaceRole.EDITOR]);

  await prisma.$transaction(async (tx) => {
    const current = await tx.budgetPeriod.findFirst({
      where: {
        budgetId,
        status: "ACTIVE"
      },
      include: {
        incomes: true,
        expenses: true,
        debts: true,
        savingGoals: true
      },
      orderBy: [{ year: "desc" }, { month: "desc" }]
    });

    if (!current) {
      throw new Error("No hay un periodo activo para copiar.");
    }

    const nextMonthDate = new Date(Date.UTC(current.year, current.month, 1));
    const year = nextMonthDate.getUTCFullYear();
    const month = nextMonthDate.getUTCMonth() + 1;

    const existing = await tx.budgetPeriod.findUnique({
      where: {
        budgetId_year_month: {
          budgetId,
          year,
          month
        }
      }
    });

    if (existing) {
      return;
    }

    const nextPeriod = await tx.budgetPeriod.create({
      data: {
        budgetId,
        year,
        month,
        status: "DRAFT"
      }
    });

    await tx.income.createMany({
      data: current.incomes.map((income) => {
        const fortnight = expectedIncomeByFortnight(income, year, month);
        return {
          budgetPeriodId: nextPeriod.id,
          responsibleName: income.responsibleName,
          amount: income.amount,
          amountType: income.amountType,
          frequency: income.frequency,
          startDate: income.startDate,
          endDate: income.endDate,
          customRule: income.customRule,
          expectedPaymentDays: income.expectedPaymentDays,
          amountMonthly: estimateMonthlyIncome(income),
          amountQ1: fortnight.q1,
          amountQ2: fortnight.q2,
          source: income.source,
          notes: income.notes,
          isActive: income.isActive,
          createdById: access.user.id,
          updatedById: access.user.id
        };
      })
    });

    await tx.expense.createMany({
      data: current.expenses.map((expense) => ({
        budgetPeriodId: nextPeriod.id,
        name: expense.name,
        responsibleName: expense.responsibleName,
        categoryId: expense.categoryId,
        amountBudgetedMonthly: expense.amountBudgetedMonthly,
        amountQ1: expense.amountQ1,
        amountQ2: expense.amountQ2,
        bankAccountId: expense.bankAccountId,
        actualAmount: 0,
        difference: -Number(expense.amountBudgetedMonthly),
        status: "PENDING",
        expenseDate: null,
        isRecurring: expense.isRecurring,
        isActive: expense.isActive,
        notes: expense.notes,
        createdById: access.user.id,
        updatedById: access.user.id
      }))
    });

    await tx.debt.createMany({
      data: current.debts.map((debt) => {
        const shouldApplyMonthlyPayment = debt.status === "ACTIVE";
        const nextRemainingMonths = shouldApplyMonthlyPayment ? Math.max(debt.remainingMonths - 1, 0) : debt.remainingMonths;
        const nextPendingBalance = shouldApplyMonthlyPayment
          ? Math.max(Number(debt.pendingBalance) - Number(debt.monthlyPayment), 0)
          : debt.pendingBalance;
        const nextStatus = shouldApplyMonthlyPayment && Number(nextPendingBalance) <= 0 ? "PAID" : debt.status;

        return {
          budgetPeriodId: nextPeriod.id,
          name: debt.name,
          entity: debt.entity,
          responsibleName: debt.responsibleName,
          pendingBalance: nextPendingBalance,
          monthlyPayment: debt.monthlyPayment,
          annualInterestRate: debt.annualInterestRate,
          remainingMonths: nextRemainingMonths,
          estimatedTotalInterest: calculateDebtInterest(nextPendingBalance, debt.annualInterestRate, nextRemainingMonths),
          strategy: debt.strategy,
          startDate: debt.startDate,
          estimatedCloseDate: debt.estimatedCloseDate,
          status: nextStatus,
          notes: debt.notes,
          createdById: access.user.id,
          updatedById: access.user.id
        };
      })
    });

    await tx.savingGoal.createMany({
      data: current.savingGoals.map((goal) => ({
        budgetPeriodId: nextPeriod.id,
        name: goal.name,
        monthlyTarget: goal.monthlyTarget,
        contributedThisMonth: 0,
        accumulatedBalance: goal.accumulatedBalance,
        institution: goal.institution,
        priority: goal.priority,
        notes: goal.notes,
        createdById: access.user.id,
        updatedById: access.user.id
      }))
    });

    await audit(tx, {
      workspaceId: access.budget.workspaceId,
      userId: access.user.id,
      entityType: "BudgetPeriod",
      entityId: nextPeriod.id,
      action: "CREATE_PERIOD",
      newValue: {
        copiedFrom: current.id,
        year,
        month
      }
    });
  });

  revalidatePath(`/app/budgets/${budgetId}/history`);
}
