export type DecimalLike =
  | number
  | string
  | null
  | undefined
  | {
      toNumber: () => number;
    };

export type ExpenseStatusValue = "PENDING" | "OK" | "EXCEEDED";
export type IncomeFrequencyValue =
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

type IncomeLike = {
  amount?: DecimalLike;
  amountQ1?: DecimalLike;
  amountQ2?: DecimalLike;
  frequency?: IncomeFrequencyValue;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  expectedPaymentDays?: number[];
  receipts?: IncomeReceiptLike[];
  isActive?: boolean;
};

type IncomeReceiptLike = {
  amount: DecimalLike;
  receivedDate?: Date | string | null;
};

type ExpenseLike = {
  id?: string;
  amountBudgetedMonthly: DecimalLike;
  amountQ1: DecimalLike;
  amountQ2: DecimalLike;
  actualAmount?: DecimalLike;
  status?: ExpenseStatusValue;
  isActive?: boolean;
  categoryId?: string;
  payments?: ExpensePaymentLike[];
};

type ExpensePaymentLike = {
  amount: DecimalLike;
  expenseId?: string | null;
  categoryId?: string;
};

type DebtLike = {
  pendingBalance: DecimalLike;
  monthlyPayment: DecimalLike;
  status?: string;
};

type SavingGoalLike = {
  monthlyTarget: DecimalLike;
  contributedThisMonth: DecimalLike;
  accumulatedBalance: DecimalLike;
};

type CategoryLike = {
  id: string;
  name: string;
  recommendedMaxPercent: DecimalLike;
};

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return value.toNumber();
}

export function sum(values: DecimalLike[]): number {
  return values.reduce<number>((total, value) => total + toNumber(value), 0);
}

export function safePercent(value: DecimalLike, total: DecimalLike): number {
  const denominator = toNumber(total);
  if (denominator <= 0) return 0;
  return (toNumber(value) / denominator) * 100;
}

export function calculateExpenseDifference(actualAmount: DecimalLike, budgetedAmount: DecimalLike): number {
  return toNumber(actualAmount) - toNumber(budgetedAmount);
}

export function calculateExpenseStatus(
  actualAmount: DecimalLike,
  budgetedAmount: DecimalLike
): ExpenseStatusValue {
  const actual = toNumber(actualAmount);
  if (actual <= 0) return "PENDING";
  return actual <= toNumber(budgetedAmount) ? "OK" : "EXCEEDED";
}

export function calculateDebtInterest(
  pendingBalance: DecimalLike,
  annualInterestRate: DecimalLike,
  remainingMonths: number
): number {
  return toNumber(pendingBalance) * (toNumber(annualInterestRate) / 100 / 12) * remainingMonths;
}

export function savingGoalProgress(contributed: DecimalLike, target: DecimalLike): number {
  return Math.min(safePercent(contributed, target), 100);
}

export function emergencyFundProgress(current: DecimalLike, target: DecimalLike): number {
  return Math.min(safePercent(current, target), 100);
}

function getIncomeAmount(income: IncomeLike) {
  return toNumber(income.amount);
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

function monthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthEnd(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function incomeOverlapsPeriod(income: IncomeLike, year: number, month: number) {
  const startDate = toDate(income.startDate);
  const endDate = toDate(income.endDate);
  const periodStart = monthStart(year, month);
  const periodEnd = monthEnd(year, month);

  if (startDate && startDate > periodEnd) return false;
  if (endDate && endDate < periodStart) return false;
  return true;
}

function monthsBetween(start: Date, year: number, month: number) {
  return (year - start.getUTCFullYear()) * 12 + (month - (start.getUTCMonth() + 1));
}

function isFrequencyDueThisMonth(income: IncomeLike, year: number, month: number, intervalMonths: number) {
  const startDate = toDate(income.startDate) ?? monthStart(year, month);
  const diff = monthsBetween(startDate, year, month);
  return diff >= 0 && diff % intervalMonths === 0;
}

function countExpectedPaymentDays(income: IncomeLike, year: number, month: number) {
  const days = income.expectedPaymentDays ?? [];
  if (days.length === 0) return 0;
  const lastDay = daysInMonth(year, month);
  return days.filter((day) => day >= 1 && day <= lastDay).length;
}

export function estimateAnnualIncome(income: IncomeLike) {
  const amount = getIncomeAmount(income);
  const frequency = income.frequency ?? "MONTHLY";

  switch (frequency) {
    case "ONE_TIME":
      return amount;
    case "DAILY":
      return amount * 365;
    case "WEEKLY":
      return amount * 52;
    case "BIWEEKLY":
      return amount * 26;
    case "MONTHLY":
      return amount * 12;
    case "BIMONTHLY":
      return amount * 6;
    case "QUARTERLY":
      return amount * 4;
    case "SEMIANNUAL":
      return amount * 2;
    case "ANNUAL":
      return amount;
    case "IRREGULAR":
    case "CUSTOM":
      return amount * 12;
    default:
      return amount * 12;
  }
}

export function expectedIncomeForPeriod(income: IncomeLike, year: number, month: number) {
  if (income.isActive === false || !incomeOverlapsPeriod(income, year, month)) return 0;

  const amount = getIncomeAmount(income);
  const frequency = income.frequency ?? "MONTHLY";
  const explicitPaymentDays = countExpectedPaymentDays(income, year, month);

  switch (frequency) {
    case "ONE_TIME": {
      const startDate = toDate(income.startDate);
      if (!startDate) return amount;
      return startDate.getUTCFullYear() === year && startDate.getUTCMonth() + 1 === month ? amount : 0;
    }
    case "DAILY":
      return amount * daysInMonth(year, month);
    case "WEEKLY":
      return explicitPaymentDays > 0 ? amount * explicitPaymentDays : amount * 52 / 12;
    case "BIWEEKLY":
      return explicitPaymentDays > 0 ? amount * explicitPaymentDays : amount * 2;
    case "MONTHLY":
      return amount;
    case "BIMONTHLY":
      return isFrequencyDueThisMonth(income, year, month, 2) ? amount : 0;
    case "QUARTERLY":
      return isFrequencyDueThisMonth(income, year, month, 3) ? amount : 0;
    case "SEMIANNUAL":
      return isFrequencyDueThisMonth(income, year, month, 6) ? amount : 0;
    case "ANNUAL":
      return isFrequencyDueThisMonth(income, year, month, 12) ? amount : 0;
    case "IRREGULAR":
    case "CUSTOM":
      return amount;
    default:
      return amount;
  }
}

export function expectedIncomeByFortnight(income: IncomeLike, year: number, month: number) {
  const expected = expectedIncomeForPeriod(income, year, month);
  const paymentDays = income.expectedPaymentDays?.filter((day) => day >= 1 && day <= daysInMonth(year, month)) ?? [];

  if (paymentDays.length > 0) {
    const q1Count = paymentDays.filter((day) => day <= 15).length;
    const q2Count = paymentDays.length - q1Count;
    return {
      q1: expected * safePercent(q1Count, paymentDays.length) / 100,
      q2: expected * safePercent(q2Count, paymentDays.length) / 100
    };
  }

  const startDate = toDate(income.startDate);
  if ((income.frequency ?? "MONTHLY") === "ONE_TIME" && startDate) {
    return startDate.getUTCDate() <= 15 ? { q1: expected, q2: 0 } : { q1: 0, q2: expected };
  }

  return {
    q1: expected / 2,
    q2: expected / 2
  };
}

function incomeReceiptsForPeriod(input: { incomeReceipts?: IncomeReceiptLike[]; incomes: IncomeLike[] }) {
  return input.incomeReceipts ?? input.incomes.flatMap((income) => income.receipts ?? []);
}

export function receivedIncomeForPeriod(input: { incomeReceipts?: IncomeReceiptLike[]; incomes: IncomeLike[] }) {
  return sum(incomeReceiptsForPeriod(input).map((receipt) => receipt.amount));
}

export function receivedIncomeForIncome(income: IncomeLike) {
  return sum((income.receipts ?? []).map((receipt) => receipt.amount));
}

export function actualExpenseAmount(expense: ExpenseLike) {
  const payments = expense.payments ?? [];
  if (payments.length > 0) {
    return sum(payments.map((payment) => payment.amount));
  }

  return toNumber(expense.actualAmount);
}

function actualExpensesForPeriod(input: { expenses: ExpenseLike[]; expensePayments?: ExpensePaymentLike[] }) {
  if (!input.expensePayments) {
    return sum(input.expenses.filter((expense) => expense.isActive !== false).map(actualExpenseAmount));
  }

  const linkedExpenseIds = new Set(
    input.expensePayments
      .map((payment) => payment.expenseId)
      .filter((expenseId): expenseId is string => Boolean(expenseId))
  );
  const paymentTotal = sum(input.expensePayments.map((payment) => payment.amount));
  const fallbackActual = sum(
    input.expenses
      .filter((expense) => expense.isActive !== false)
      .filter((expense) => !expense.id || !linkedExpenseIds.has(expense.id))
      .map((expense) => expense.actualAmount)
  );

  return paymentTotal + fallbackActual;
}

export function buildBudgetSummary(input: {
  year: number;
  month: number;
  incomes: IncomeLike[];
  incomeReceipts?: IncomeReceiptLike[];
  expenses: ExpenseLike[];
  expensePayments?: ExpensePaymentLike[];
  debts: DebtLike[];
  savingGoals: SavingGoalLike[];
}) {
  const activeIncomes = input.incomes.filter((income) => income.isActive !== false);
  const activeExpenses = input.expenses.filter((expense) => expense.isActive !== false);
  const activeDebts = input.debts.filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED");

  const totalIncomeExpected = sum(activeIncomes.map((income) => expectedIncomeForPeriod(income, input.year, input.month)));
  const totalIncomeQ1 = sum(activeIncomes.map((income) => expectedIncomeByFortnight(income, input.year, input.month).q1));
  const totalIncomeQ2 = sum(activeIncomes.map((income) => expectedIncomeByFortnight(income, input.year, input.month).q2));
  const totalIncomeAnnualEstimated = sum(activeIncomes.map((income) => estimateAnnualIncome(income)));
  const totalIncomeReceived = receivedIncomeForPeriod(input);
  const totalBudgetedExpenses = sum(activeExpenses.map((expense) => expense.amountBudgetedMonthly));
  const totalActualExpenses = actualExpensesForPeriod(input);
  const totalExpensesQ1 = sum(activeExpenses.map((expense) => expense.amountQ1));
  const totalExpensesQ2 = sum(activeExpenses.map((expense) => expense.amountQ2));
  const totalSavingPlanned = sum(input.savingGoals.map((goal) => goal.monthlyTarget));
  const totalSavingContributed = sum(input.savingGoals.map((goal) => goal.contributedThisMonth));
  const totalDebtPending = sum(activeDebts.map((debt) => debt.pendingBalance));
  const totalDebtMonthlyPayments = sum(activeDebts.map((debt) => debt.monthlyPayment));
  const savingQ1 = totalSavingPlanned / 2;
  const savingQ2 = totalSavingPlanned / 2;
  const debtQ1 = totalDebtMonthlyPayments / 2;
  const debtQ2 = totalDebtMonthlyPayments / 2;
  const availableBalanceReal = totalIncomeReceived - totalActualExpenses - totalSavingContributed - totalDebtMonthlyPayments;
  const incomePercentBase = totalIncomeReceived > 0 ? totalIncomeReceived : totalIncomeExpected;

  return {
    totalIncomeExpected,
    totalIncomeQ1,
    totalIncomeQ2,
    totalIncomeAnnualEstimated,
    totalIncomeReceived,
    incomeVariance: totalIncomeReceived - totalIncomeExpected,
    totalBudgetedExpenses,
    totalActualExpenses,
    totalSavingPlanned,
    totalSavingContributed,
    totalDebtPending,
    totalDebtMonthlyPayments,
    availableBalance: totalIncomeExpected - totalActualExpenses - totalSavingContributed - totalDebtMonthlyPayments,
    availableBalanceReal,
    availableBalanceQ1: totalIncomeQ1 - totalExpensesQ1 - savingQ1 - debtQ1,
    availableBalanceQ2: totalIncomeQ2 - totalExpensesQ2 - savingQ2 - debtQ2,
    expensePercentOfIncome: safePercent(totalActualExpenses, incomePercentBase),
    budgetedExpensePercentOfIncome: safePercent(totalBudgetedExpenses, totalIncomeExpected),
    savingPercentOfIncome: safePercent(totalSavingContributed, incomePercentBase),
    debtPaymentPercentOfIncome: safePercent(totalDebtMonthlyPayments, incomePercentBase),
    generalStatus:
      totalActualExpenses + totalSavingContributed + totalDebtMonthlyPayments <= totalIncomeExpected ? "OK" : "EXCEEDED",
    generalStatusReal:
      totalActualExpenses + totalSavingContributed + totalDebtMonthlyPayments <= totalIncomeReceived ? "OK" : "EXCEEDED"
  };
}

export function buildCategoryBreakdown(
  expenses: ExpenseLike[],
  categories: CategoryLike[],
  totalIncome: DecimalLike,
  expensePayments?: ExpensePaymentLike[]
) {
  return categories.map((category) => {
    const categoryExpenses = expenses.filter(
      (expense) => expense.isActive !== false && expense.categoryId === category.id
    );
    const budgeted = sum(categoryExpenses.map((expense) => expense.amountBudgetedMonthly));
    const actual = expensePayments
      ? sum(expensePayments.filter((payment) => payment.categoryId === category.id).map((payment) => payment.amount)) +
        sum(
          categoryExpenses
            .filter((expense) => !expense.id || !expensePayments.some((payment) => payment.expenseId === expense.id))
            .map((expense) => expense.actualAmount)
        )
      : sum(categoryExpenses.map(actualExpenseAmount));
    const percentOfIncome = safePercent(actual || budgeted, totalIncome);
    const recommendedMaxPercent = toNumber(category.recommendedMaxPercent);

    return {
      categoryId: category.id,
      categoryName: category.name,
      budgeted,
      actual,
      difference: actual - budgeted,
      percentOfIncome,
      recommendedMaxPercent,
      status:
        actual <= 0
          ? "PENDING"
          : percentOfIncome <= recommendedMaxPercent
            ? "OK"
            : "EXCEEDED"
    };
  });
}

export function comparePeriods(current: ReturnType<typeof buildBudgetSummary>, previous?: ReturnType<typeof buildBudgetSummary>) {
  if (!previous) {
    return {
      incomeDelta: 0,
      expensesDelta: 0,
      savingDelta: 0,
      availableDelta: 0
    };
  }

  return {
    incomeDelta: current.totalIncomeReceived - previous.totalIncomeReceived,
    expensesDelta: current.totalActualExpenses - previous.totalActualExpenses,
    savingDelta: current.totalSavingContributed - previous.totalSavingContributed,
    availableDelta: current.availableBalanceReal - previous.availableBalanceReal
  };
}
