import { Prisma, PrismaClient } from "@prisma/client";

import {
  calculateDebtInterest,
  calculateExpenseDifference,
  calculateExpenseStatus,
  expectedIncomeByFortnight,
  expectedIncomeForPeriod,
  sum
} from "../src/lib/finance";

const prisma = new PrismaClient();

const seedActions = [
  "CREATE_WORKSPACE",
  "CREATE_BUDGET",
  "CREATE_PERIOD",
  "CREATE_INCOME",
  "CREATE_EXPENSE",
  "CREATE_DEBT",
  "CREATE_SAVING_GOAL",
  "INVITE_MEMBER"
];

const categories: readonly [string, string, number][] = [
  ["Casa", "home", 30],
  ["Vehículo", "car", 15],
  ["Comida", "utensils", 15],
  ["Préstamo", "credit-card", 20],
  ["Personal", "user", 10],
  ["Entretenimiento", "gamepad", 5],
  ["Transporte", "bus", 5],
  ["Otros", "more-horizontal", 5]
];

const accounts: readonly [string, string, string][] = [
  ["Banreserva", "Banreserva", "Banco"],
  ["APAP", "APAP", "Banco / Préstamo"],
  ["QIK", "QIK", "Banco digital / Préstamo"],
  ["BSC Pricesmart", "Banco Santa Cruz", "Tarjeta de crédito"],
  ["Efectivo", "N/A", "Efectivo"]
];

type SeedIncome = {
  responsibleName: string;
  source: string;
  amount: number;
  amountType: "FIXED" | "VARIABLE" | "ESTIMATED";
  frequency:
    | "ONE_TIME"
    | "DAILY"
    | "WEEKLY"
    | "BIWEEKLY"
    | "MONTHLY"
    | "BIMONTHLY"
    | "QUARTERLY"
    | "SEMIANNUAL"
    | "ANNUAL"
    | "IRREGULAR"
    | "CUSTOM";
  startDay?: number;
  endDay?: number;
  customRule?: string;
  expectedPaymentDays?: number[];
  notes?: string;
  isActive?: boolean;
};

type SeedExpense = readonly [
  name: string,
  responsibleName: string,
  categoryName: string,
  amountBudgetedMonthly: number,
  amountQ1: number,
  amountQ2: number,
  accountName: string,
  actualAmount: number,
  isRecurring: boolean
];

type SeedSavingGoal = readonly [
  name: string,
  monthlyTarget: number,
  contributedThisMonth: number,
  accumulatedBalance: number,
  institution: string,
  priority: number,
  notes: string
];

type SeedDebt = readonly [
  name: string,
  entity: string,
  responsibleName: string,
  pendingBalance: number,
  monthlyPayment: number,
  annualInterestRate: number,
  remainingMonths: number,
  strategy: "AVALANCHE" | "SNOWBALL" | "CUSTOM"
];

const juneIncomes: SeedIncome[] = [
  {
    responsibleName: "Wife",
    source: "Banreserva",
    amount: 37593.22,
    amountType: "FIXED",
    frequency: "MONTHLY",
    expectedPaymentDays: [15, 30],
    notes: "Ingreso fijo mensual dividido por quincenas."
  },
  {
    responsibleName: "Husband",
    source: "Banreserva",
    amount: 88563.62,
    amountType: "FIXED",
    frequency: "MONTHLY",
    expectedPaymentDays: [15, 30],
    notes: "Ingreso fijo mensual dividido por quincenas."
  }
];

const juneExpenses: SeedExpense[] = [
  ["Alquiler o Hipoteca", "Husband", "Casa", 18000, 9000, 9000, "Banreserva", 18000, true],
  ["Compra mensual de comida", "Wife", "Comida", 16000, 8000, 8000, "Banreserva", 17500, true],
  ["Teléfonos", "Husband", "Casa", 3500, 1750, 1750, "Banreserva", 3500, true],
  ["Internet", "Husband", "Casa", 2800, 0, 2800, "Banreserva", 2800, true],
  ["Netflix", "Wife", "Entretenimiento", 600, 0, 600, "Banreserva", 600, true],
  ["Microsoft", "Husband", "Entretenimiento", 500, 500, 0, "Banreserva", 500, true],
  ["Natación", "Wife", "Personal", 2000, 1000, 1000, "Efectivo", 2000, true],
  ["Peluquería", "Husband", "Personal", 1500, 750, 750, "Efectivo", 1800, true],
  ["Salón", "Wife", "Personal", 2500, 1250, 1250, "Efectivo", 2500, true],
  ["Combustible", "Husband", "Transporte", 8000, 4000, 4000, "Efectivo", 8500, true],
  ["Moto Uber", "Wife", "Transporte", 3000, 1500, 1500, "Efectivo", 2700, true],
  ["Pago del vehículo", "Husband", "Vehículo", 18500, 9250, 9250, "Banreserva", 18500, true],
  ["Préstamo APAP", "Husband", "Préstamo", 10000, 5000, 5000, "APAP", 10000, true],
  ["Préstamo Credimas Banreserva", "Wife", "Préstamo", 6000, 3000, 3000, "Banreserva", 6000, true],
  ["Préstamos QIK", "Husband", "Préstamo", 5500, 2750, 2750, "QIK", 5500, true],
  ["Entretenimiento personal", "Ambos", "Entretenimiento", 4000, 2000, 2000, "Efectivo", 4800, false],
  ["Otros", "Ambos", "Otros", 3000, 1500, 1500, "Efectivo", 0, false]
];

const debts: SeedDebt[] = [
  ["Préstamo APAP", "APAP", "Husband", 180000, 10000, 18, 18, "AVALANCHE"],
  ["Préstamo Credimas Banreserva", "Banreserva", "Wife", 60000, 6000, 24, 10, "SNOWBALL"],
  ["Préstamos QIK", "QIK", "Husband", 45000, 5500, 30, 8, "AVALANCHE"],
  ["Tarjeta BSC Pricesmart", "Banco Santa Cruz", "Ambos", 35000, 4000, 60, 9, "AVALANCHE"],
  ["Promedio avance efectivo", "Varios", "Ambos", 25000, 3500, 48, 7, "SNOWBALL"],
  ["Pago vehículo", "Financiera vehículo", "Husband", 700000, 18500, 16.8, 48, "CUSTOM"]
];

const juneSavingGoals: SeedSavingGoal[] = [
  ["Fondo de emergencia", 5000, 5000, 25000, "Banreserva", 1, "Prioridad principal del hogar."],
  ["AFP Voluntaria", 2000, 2000, 10000, "AFP", 2, ""],
  ["Inversión", 3000, 1500, 8000, "Cuenta de inversión", 2, ""],
  ["Viajes / Vacaciones", 2000, 1000, 6000, "Banreserva", 3, ""],
  ["Educación / Colegios", 2500, 2500, 12000, "Banreserva", 2, ""],
  ["Mantenimiento del hogar", 1500, 0, 3000, "Efectivo", 4, ""]
];

function dateUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {
  const husband = await prisma.user.upsert({
    where: { email: "husband@example.com" },
    update: { name: "Husband" },
    create: {
      name: "Husband",
      email: "husband@example.com",
      emailVerified: new Date()
    }
  });

  const wife = await prisma.user.upsert({
    where: { email: "wife@example.com" },
    update: { name: "Wife" },
    create: {
      name: "Wife",
      email: "wife@example.com",
      emailVerified: new Date()
    }
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@example.com" },
    update: { name: "Familiar Viewer" },
    create: {
      name: "Familiar Viewer",
      email: "viewer@example.com",
      emailVerified: new Date()
    }
  });

  const family = await prisma.user.upsert({
    where: { email: "family@example.com" },
    update: { name: "Ambos" },
    create: {
      name: "Ambos",
      email: "family@example.com",
      emailVerified: new Date()
    }
  });

  let workspace = await prisma.workspace.findFirst({
    where: {
      name: "Presupuesto Familiar",
      ownerId: husband.id
    }
  });

  workspace =
    workspace ??
    (await prisma.workspace.create({
      data: {
        name: "Presupuesto Familiar",
        ownerId: husband.id
      }
    }));

  const husbandMember = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: husband.id } },
    update: { role: "OWNER" },
    create: { workspaceId: workspace.id, userId: husband.id, role: "OWNER" }
  });
  const wifeMember = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: wife.id } },
    update: { role: "EDITOR" },
    create: { workspaceId: workspace.id, userId: wife.id, role: "EDITOR" }
  });
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: viewer.id } },
    update: { role: "VIEWER" },
    create: { workspaceId: workspace.id, userId: viewer.id, role: "VIEWER" }
  });
  const familyMember = await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: family.id } },
    update: { role: "EDITOR" },
    create: { workspaceId: workspace.id, userId: family.id, role: "EDITOR" }
  });

  const responsibleMemberByName = new Map<string, string>([
    ["Husband", husbandMember.id],
    ["Wife", wifeMember.id],
    ["Ambos", familyMember.id]
  ]);

  const budget = await prisma.budget.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: "Presupuesto Familiar Principal"
      }
    },
    update: {
      currency: "RD$",
      startDayOfMonth: 1,
      monthlySavingTarget: 16000,
      savingTargetPercent: 10,
      emergencyFundTarget: 250000,
      emergencyFundCurrent: 25000
    },
    create: {
      workspaceId: workspace.id,
      name: "Presupuesto Familiar Principal",
      currency: "RD$",
      startDayOfMonth: 1,
      monthlySavingTarget: 16000,
      savingTargetPercent: 10,
      emergencyFundTarget: 250000,
      emergencyFundCurrent: 25000
    }
  });

  const dopCurrency = await prisma.currency.upsert({
    where: {
      budgetId_code: {
        budgetId: budget.id,
        code: "DOP"
      }
    },
    update: {
      name: "Peso Dominicano",
      symbol: "RD$",
      defaultRateToDop: 1,
      isBase: true,
      isActive: true
    },
    create: {
      budgetId: budget.id,
      code: "DOP",
      name: "Peso Dominicano",
      symbol: "RD$",
      defaultRateToDop: 1,
      isBase: true,
      isActive: true
    }
  });

  await prisma.auditLog.deleteMany({
    where: {
      workspaceId: workspace.id,
      action: {
        in: seedActions
      }
    }
  });

  const categoryByName = new Map<string, string>();
  for (const [name, icon, recommendedMaxPercent] of categories) {
    const category = await prisma.expenseCategory.upsert({
      where: { budgetId_name: { budgetId: budget.id, name } },
      update: { icon, recommendedMaxPercent, isDefault: true },
      create: { budgetId: budget.id, name, icon, recommendedMaxPercent, isDefault: true }
    });
    categoryByName.set(name, category.id);
  }

  const accountByName = new Map<string, string>();
  for (const [name, institution, type] of accounts) {
    const account = await prisma.bankAccount.upsert({
      where: { budgetId_name: { budgetId: budget.id, name } },
      update: { institution, type },
      create: { budgetId: budget.id, name, institution, type }
    });
    accountByName.set(name, account.id);
  }

  const junePeriod = await prisma.budgetPeriod.upsert({
    where: { budgetId_year_month: { budgetId: budget.id, year: 2026, month: 6 } },
    update: { status: "ACTIVE" },
    create: { budgetId: budget.id, year: 2026, month: 6, status: "ACTIVE" }
  });

  const mayPeriod = await prisma.budgetPeriod.upsert({
    where: { budgetId_year_month: { budgetId: budget.id, year: 2026, month: 5 } },
    update: { status: "CLOSED" },
    create: { budgetId: budget.id, year: 2026, month: 5, status: "CLOSED" }
  });

  await seedPeriod({
    periodId: junePeriod.id,
    workspaceId: workspace.id,
    userId: husband.id,
    year: 2026,
    month: 6,
    incomes: juneIncomes,
    expenses: juneExpenses,
    savings: juneSavingGoals,
    categoryByName,
    accountByName,
    currencyId: dopCurrency.id,
    responsibleMemberByName
  });

  const mayExpenses: SeedExpense[] = juneExpenses.map((expense) => {
    const [name, responsibleName, categoryName, amountBudgetedMonthly, amountQ1, amountQ2, accountName, actualAmount, isRecurring] =
      expense;
    const adjustedActual =
      name === "Compra mensual de comida"
        ? 15800
        : name === "Combustible"
          ? 7700
          : name === "Entretenimiento personal"
            ? 3500
            : actualAmount;

    return [
      name,
      responsibleName,
      categoryName,
      amountBudgetedMonthly,
      amountQ1,
      amountQ2,
      accountName,
      adjustedActual,
      isRecurring
    ];
  });

  const maySavings: SeedSavingGoal[] = juneSavingGoals.map((goal) => {
    const [name, monthlyTarget, contributedThisMonth, accumulatedBalance, institution, priority, notes] = goal;
    const adjustedContribution =
      name === "Inversión"
        ? 1000
        : name === "Viajes / Vacaciones"
          ? 500
          : name === "Mantenimiento del hogar"
            ? 1000
            : contributedThisMonth;

    return [name, monthlyTarget, adjustedContribution, accumulatedBalance, institution, priority, notes];
  });

  await seedPeriod({
    periodId: mayPeriod.id,
    workspaceId: workspace.id,
    userId: husband.id,
    year: 2026,
    month: 5,
    incomes: juneIncomes,
    expenses: mayExpenses,
    savings: maySavings,
    categoryByName,
    accountByName,
    currencyId: dopCurrency.id,
    responsibleMemberByName
  });

  for (const [name, entity, responsibleName, pendingBalance, monthlyPayment, annualInterestRate, remainingMonths, strategy] of debts) {
    const estimatedTotalInterest = calculateDebtInterest(pendingBalance, annualInterestRate, remainingMonths);
    const responsibleMemberId = responsibleMemberByName.get(responsibleName);
    const debt = await prisma.debt.upsert({
      where: {
        budgetPeriodId_name_entity: {
          budgetPeriodId: junePeriod.id,
          name,
          entity
        }
      },
      update: {
        responsibleName,
        responsibleMemberId,
        currencyId: dopCurrency.id,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        pendingBalanceOriginal: pendingBalance,
        monthlyPaymentOriginal: monthlyPayment,
        exchangeRateToDop: 1,
        pendingBalanceDop: pendingBalance,
        monthlyPaymentDop: monthlyPayment,
        pendingBalance,
        monthlyPayment,
        annualInterestRate,
        remainingMonths,
        estimatedTotalInterest,
        strategy,
        status: "ACTIVE",
        updatedById: husband.id
      },
      create: {
        budgetPeriodId: junePeriod.id,
        name,
        entity,
        responsibleName,
        responsibleMemberId,
        currencyId: dopCurrency.id,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        pendingBalanceOriginal: pendingBalance,
        monthlyPaymentOriginal: monthlyPayment,
        exchangeRateToDop: 1,
        pendingBalanceDop: pendingBalance,
        monthlyPaymentDop: monthlyPayment,
        pendingBalance,
        monthlyPayment,
        annualInterestRate,
        remainingMonths,
        estimatedTotalInterest,
        strategy,
        startDate: dateUtc(2026, 6, 1),
        estimatedCloseDate: dateUtc(2026, 6 + remainingMonths, 1),
        status: "ACTIVE",
        createdById: husband.id,
        updatedById: husband.id
      }
    });

    await createAudit(workspace.id, husband.id, "Debt", debt.id, "CREATE_DEBT", {
      name,
      entity,
      pendingBalance
    });
  }

  const invitation = await prisma.invitation.findFirst({
    where: {
      workspaceId: workspace.id,
      email: "guest@example.com",
      status: "PENDING"
    }
  });

  if (!invitation) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const createdInvitation = await prisma.invitation.create({
      data: {
        workspaceId: workspace.id,
        email: "guest@example.com",
        role: "VIEWER",
        token: "seed-guest-viewer-token",
        status: "PENDING",
        invitedById: husband.id,
        expiresAt
      }
    });

    await createAudit(workspace.id, husband.id, "Invitation", createdInvitation.id, "INVITE_MEMBER", {
      email: createdInvitation.email,
      role: createdInvitation.role
    });
  }

  await createAudit(workspace.id, husband.id, "Workspace", workspace.id, "CREATE_WORKSPACE", {
    name: workspace.name
  });
  await createAudit(workspace.id, husband.id, "Budget", budget.id, "CREATE_BUDGET", {
    name: budget.name
  });
  await createAudit(workspace.id, husband.id, "BudgetPeriod", junePeriod.id, "CREATE_PERIOD", {
    year: 2026,
    month: 6,
    status: "ACTIVE"
  });
  await createAudit(workspace.id, husband.id, "BudgetPeriod", mayPeriod.id, "CREATE_PERIOD", {
    year: 2026,
    month: 5,
    status: "CLOSED"
  });

  const juneSummary = await prisma.budgetPeriod.findUniqueOrThrow({
    where: { id: junePeriod.id },
    include: {
      incomes: true,
      incomeReceipts: true,
      expenses: true,
      debts: true,
      savingGoals: true
    }
  });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: { user: true },
    orderBy: { role: "asc" }
  });

  console.log("ATEK Budget seed completado");
  console.log({
    users: ["husband@example.com", "wife@example.com", "viewer@example.com"],
    workspace: workspace.name,
    budget: budget.name,
    periods: ["2026-06 ACTIVE", "2026-05 CLOSED"],
    totalIncomeJune2026: sum(juneSummary.incomes.map((income) => expectedIncomeForPeriod(income, 2026, 6))),
    totalIncomeReceivedJune2026: sum(juneSummary.incomeReceipts.map((receipt) => receipt.amount)),
    totalBudgetedExpensesJune2026: sum(juneSummary.expenses.map((expense) => expense.amountBudgetedMonthly)),
    totalActualExpensesJune2026: sum(juneSummary.expenses.map((expense) => expense.actualAmount)),
    totalSavingPlannedJune2026: sum(juneSummary.savingGoals.map((goal) => goal.monthlyTarget)),
    totalSavingContributedJune2026: sum(juneSummary.savingGoals.map((goal) => goal.contributedThisMonth)),
    totalDebtPending: sum(juneSummary.debts.map((debt) => debt.pendingBalance)),
    totalDebtMonthlyPayments: sum(juneSummary.debts.map((debt) => debt.monthlyPayment)),
    members: members.map((member) => `${member.user.email}: ${member.role}`)
  });
}

async function seedPeriod(input: {
  periodId: string;
  workspaceId: string;
  userId: string;
  year: number;
  month: number;
  incomes: SeedIncome[];
  expenses: SeedExpense[];
  savings: SeedSavingGoal[];
  categoryByName: Map<string, string>;
  accountByName: Map<string, string>;
  currencyId: string;
  responsibleMemberByName: Map<string, string>;
}) {
  for (const incomeInput of input.incomes) {
    const startDate = dateUtc(input.year, input.month, incomeInput.startDay ?? 1);
    const endDate = incomeInput.endDay ? dateUtc(input.year, input.month, incomeInput.endDay) : null;
    const expectedPaymentDays = incomeInput.expectedPaymentDays ?? [];
    const incomeForCalculation = {
      amount: incomeInput.amount,
      frequency: incomeInput.frequency,
      startDate,
      endDate,
      expectedPaymentDays,
      isActive: incomeInput.isActive ?? true
    };
    const fortnight = expectedIncomeByFortnight(incomeForCalculation, input.year, input.month);
    const responsibleMemberId = input.responsibleMemberByName.get(incomeInput.responsibleName);
    const income = await prisma.income.upsert({
      where: {
        budgetPeriodId_responsibleName_source: {
          budgetPeriodId: input.periodId,
          responsibleName: incomeInput.responsibleName,
          source: incomeInput.source
        }
      },
      update: {
        responsibleMemberId,
        currencyId: input.currencyId,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        amountOriginal: incomeInput.amount,
        exchangeRateToDop: 1,
        amountDop: incomeInput.amount,
        amount: incomeInput.amount,
        amountType: incomeInput.amountType,
        frequency: incomeInput.frequency,
        startDate,
        endDate,
        customRule: incomeInput.customRule,
        expectedPaymentDays,
        amountQ1: fortnight.q1,
        amountQ2: fortnight.q2,
        notes: incomeInput.notes,
        isActive: incomeInput.isActive ?? true,
        updatedById: input.userId
      },
      create: {
        budgetPeriodId: input.periodId,
        responsibleName: incomeInput.responsibleName,
        responsibleMemberId,
        currencyId: input.currencyId,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        amountOriginal: incomeInput.amount,
        exchangeRateToDop: 1,
        amountDop: incomeInput.amount,
        source: incomeInput.source,
        amount: incomeInput.amount,
        amountType: incomeInput.amountType,
        frequency: incomeInput.frequency,
        startDate,
        endDate,
        customRule: incomeInput.customRule,
        expectedPaymentDays,
        amountQ1: fortnight.q1,
        amountQ2: fortnight.q2,
        notes: incomeInput.notes,
        isActive: incomeInput.isActive ?? true,
        createdById: input.userId,
        updatedById: input.userId
      }
    });

    const paymentDays = expectedPaymentDays.length > 0 ? expectedPaymentDays : [15];
    const expectedMonth = expectedIncomeForPeriod(incomeForCalculation, input.year, input.month);
    const amountPerReceipt = expectedMonth / paymentDays.length;
    const lastDayOfMonth = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate();

    for (const day of paymentDays) {
      const receivedDate = dateUtc(input.year, input.month, Math.min(day, lastDayOfMonth));
      const existingReceipt = await prisma.incomeReceipt.findFirst({
        where: {
          budgetPeriodId: input.periodId,
          incomeId: income.id,
          receivedDate
        }
      });

      if (existingReceipt) {
        await prisma.incomeReceipt.update({
          where: { id: existingReceipt.id },
          data: {
            amount: amountPerReceipt,
            amountOriginal: amountPerReceipt,
            amountDop: amountPerReceipt,
            exchangeRateToDop: 1,
            currencyId: input.currencyId,
            currencyCode: "DOP",
            currencySymbol: "RD$",
            responsibleMemberId: income.responsibleMemberId,
            responsibleName: income.responsibleName,
            source: income.source,
            notes: "Seed ingreso esperado"
          }
        });
      } else {
        await prisma.incomeReceipt.create({
          data: {
            budgetPeriodId: input.periodId,
            incomeId: income.id,
            responsibleMemberId: income.responsibleMemberId,
            responsibleName: income.responsibleName,
            currencyId: input.currencyId,
            currencyCode: "DOP",
            currencySymbol: "RD$",
            amountOriginal: amountPerReceipt,
            exchangeRateToDop: 1,
            amountDop: amountPerReceipt,
            source: income.source,
            amount: amountPerReceipt,
            receivedDate,
            notes: "Seed ingreso esperado",
            createdById: input.userId
          }
        });
      }
    }

    await createAudit(input.workspaceId, input.userId, "Income", income.id, "CREATE_INCOME", {
      responsibleName: income.responsibleName,
      amount: incomeInput.amount,
      amountType: incomeInput.amountType,
      frequency: incomeInput.frequency,
      period: `${input.year}-${input.month}`
    });
  }

  for (const [
    name,
    responsibleName,
    categoryName,
    amountBudgetedMonthly,
    amountQ1,
    amountQ2,
    accountName,
    actualAmount,
    isRecurring
  ] of input.expenses) {
    const categoryId = input.categoryByName.get(categoryName);
    const bankAccountId = input.accountByName.get(accountName);
    if (!categoryId) throw new Error(`Categoría no encontrada: ${categoryName}`);
    if (!bankAccountId) throw new Error(`Cuenta no encontrada: ${accountName}`);

    const status = calculateExpenseStatus(actualAmount, amountBudgetedMonthly);
    const difference = calculateExpenseDifference(actualAmount, amountBudgetedMonthly);
    const responsibleMemberId = input.responsibleMemberByName.get(responsibleName);
    const expense = await prisma.expense.upsert({
      where: {
        budgetPeriodId_name: {
          budgetPeriodId: input.periodId,
          name
        }
      },
      update: {
        responsibleName,
        responsibleMemberId,
        categoryId,
        currencyId: input.currencyId,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        amountType: "FIXED",
        amountBudgetedOriginal: amountBudgetedMonthly,
        amountQ1Original: amountQ1,
        amountQ2Original: amountQ2,
        exchangeRateToDop: 1,
        amountBudgetedDop: amountBudgetedMonthly,
        amountBudgetedMonthly,
        amountQ1,
        amountQ2,
        bankAccountId,
        actualAmount,
        difference,
        status,
        expenseDate: dateUtc(input.year, input.month, 15),
        isRecurring,
        isActive: true,
        updatedById: input.userId
      },
      create: {
        budgetPeriodId: input.periodId,
        name,
        responsibleName,
        responsibleMemberId,
        categoryId,
        currencyId: input.currencyId,
        currencyCode: "DOP",
        currencySymbol: "RD$",
        amountType: "FIXED",
        amountBudgetedOriginal: amountBudgetedMonthly,
        amountQ1Original: amountQ1,
        amountQ2Original: amountQ2,
        exchangeRateToDop: 1,
        amountBudgetedDop: amountBudgetedMonthly,
        amountBudgetedMonthly,
        amountQ1,
        amountQ2,
        bankAccountId,
        actualAmount,
        difference,
        status,
        expenseDate: dateUtc(input.year, input.month, 15),
        isRecurring,
        isActive: true,
        createdById: input.userId,
        updatedById: input.userId
      }
    });

    await createAudit(input.workspaceId, input.userId, "Expense", expense.id, "CREATE_EXPENSE", {
      name,
      actualAmount,
      status,
      period: `${input.year}-${input.month}`
    });
  }

  for (const [name, monthlyTarget, contributedThisMonth, accumulatedBalance, institution, priority, notes] of input.savings) {
    const goal = await prisma.savingGoal.upsert({
      where: {
        budgetPeriodId_name: {
          budgetPeriodId: input.periodId,
          name
        }
      },
      update: {
        monthlyTarget,
        contributedThisMonth,
        accumulatedBalance,
        institution,
        priority,
        notes,
        updatedById: input.userId
      },
      create: {
        budgetPeriodId: input.periodId,
        name,
        monthlyTarget,
        contributedThisMonth,
        accumulatedBalance,
        institution,
        priority,
        notes,
        createdById: input.userId,
        updatedById: input.userId
      }
    });

    if (contributedThisMonth > 0) {
      await prisma.savingContribution.upsert({
        where: {
          savingGoalId_contributionDate: {
            savingGoalId: goal.id,
            contributionDate: dateUtc(input.year, input.month, 15)
          }
        },
        update: {
          amount: contributedThisMonth,
          notes: "Aporte de seed"
        },
        create: {
          savingGoalId: goal.id,
          amount: contributedThisMonth,
          contributionDate: dateUtc(input.year, input.month, 15),
          notes: "Aporte de seed",
          createdById: input.userId
        }
      });
    }

    await createAudit(input.workspaceId, input.userId, "SavingGoal", goal.id, "CREATE_SAVING_GOAL", {
      name,
      monthlyTarget,
      contributedThisMonth,
      period: `${input.year}-${input.month}`
    });
  }
}

async function createAudit(
  workspaceId: string,
  userId: string,
  entityType: string,
  entityId: string,
  action: string,
  newValue: Prisma.InputJsonObject
) {
  await prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      entityType,
      entityId,
      action,
      oldValue: Prisma.JsonNull,
      newValue
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
