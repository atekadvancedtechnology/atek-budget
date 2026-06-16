import { prisma } from "@/lib/prisma";
import { ensureBudgetPeriodWithRecurringData } from "@/lib/periods";

export async function getUserBudgets(userId: string) {
  return prisma.budget.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId
          }
        }
      }
    },
    include: {
      workspace: {
        include: {
          members: true
        }
      },
      periods: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 3
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  });
}

export async function getBudgetWorkspaceData(budgetId: string) {
  return prisma.budget.findUnique({
    where: {
      id: budgetId
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: true
            },
            orderBy: {
              createdAt: "asc"
            }
          },
          invitations: {
            orderBy: {
              createdAt: "desc"
            },
            take: 10
          }
        }
      },
      categories: {
        orderBy: {
          name: "asc"
        }
      },
      bankAccounts: {
        orderBy: {
          name: "asc"
        }
      },
      periods: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          incomes: {
            include: {
              receipts: {
                orderBy: {
                  receivedDate: "desc"
                }
              }
            },
            orderBy: {
              responsibleName: "asc"
            }
          },
          incomeReceipts: {
            orderBy: {
              receivedDate: "desc"
            }
          },
          expenses: {
            include: {
              category: true,
              bankAccount: true
            },
            orderBy: {
              name: "asc"
            }
          },
          debts: {
            orderBy: {
              pendingBalance: "desc"
            }
          },
          savingGoals: {
            include: {
              contributions: true
            },
            orderBy: {
              priority: "asc"
            }
          }
        }
      }
    }
  });
}

export function selectActivePeriod<T extends { status: string; year: number; month: number }>(periods: T[]) {
  return periods.find((period) => period.status === "ACTIVE") ?? periods[0];
}

export type PeriodSelectionQuery = {
  year?: string;
  month?: string;
};

export function currentPeriodDate() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
}

export function parsePeriodSelection(query?: PeriodSelectionQuery) {
  const current = currentPeriodDate();
  const year = Number.parseInt(query?.year ?? "", 10);
  const month = Number.parseInt(query?.month ?? "", 10);

  return {
    year: Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : current.year,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : current.month
  };
}

export function selectPeriodForQuery<T extends { year: number; month: number }>(
  periods: T[],
  query?: PeriodSelectionQuery
) {
  const selection = parsePeriodSelection(query);
  return {
    ...selection,
    period: periods.find((period) => period.year === selection.year && period.month === selection.month)
  };
}

export async function getBudgetWorkspaceDataForPeriod(
  budgetId: string,
  query?: PeriodSelectionQuery,
  userId?: string
) {
  let budget = await getBudgetWorkspaceData(budgetId);
  if (!budget) return null;

  let selection = selectPeriodForQuery(budget.periods, query);
  if (!selection.period) {
    await ensureBudgetPeriodWithRecurringData(
      budgetId,
      {
        year: selection.year,
        month: selection.month
      },
      userId
    );
    budget = await getBudgetWorkspaceData(budgetId);
    if (!budget) return null;
    selection = selectPeriodForQuery(budget.periods, query);
  }

  return {
    budget,
    selection,
    selectedPeriod: selection.period
  };
}

export function emptyPeriodInput(year: number, month: number) {
  return {
    year,
    month,
    incomes: [],
    incomeReceipts: [],
    expenses: [],
    debts: [],
    savingGoals: []
  };
}

export function shiftPeriod(year: number, month: number, monthDelta: number) {
  const date = new Date(Date.UTC(year, month - 1 + monthDelta, 1));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1
  };
}

export function periodHref(basePath: string, year: number, month: number, extra?: Record<string, string | undefined>) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month)
  });

  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }

  return `${basePath}?${params.toString()}`;
}

export function selectPreviousPeriod<T extends { id: string; year: number; month: number }>(
  periods: T[],
  currentPeriod?: { id: string; year: number; month: number }
) {
  if (!currentPeriod) return undefined;
  return periods.find((period) => {
    if (period.id === currentPeriod.id) return false;
    if (period.year < currentPeriod.year) return true;
    return period.year === currentPeriod.year && period.month < currentPeriod.month;
  });
}
