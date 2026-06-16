import { notFound } from "next/navigation";

import { ExpenseForm } from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { RecordActions } from "@/components/record-actions";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, periodHref } from "@/lib/data";
import { buildBudgetSummary } from "@/lib/finance";
import { formatCurrency, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    editExpense?: string;
    month?: string;
    year?: string;
  }>;
};

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function ExpensesPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { budget, selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/expenses`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));
  const returnPath = periodHref(basePath, selection.year, selection.month);
  const editExpense = selectedPeriod?.expenses.find((expense) => expense.id === query?.editExpense);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Gastos</p>
        <h2 className="text-2xl font-semibold tracking-normal">
          {periodLabel(selection.year, selection.month)}
        </h2>
      </div>

      <PeriodSelector
        basePath={basePath}
        hasPeriod={Boolean(selectedPeriod)}
        month={selection.month}
        status={selectedPeriod?.status}
        year={selection.year}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Presupuestado" value={formatCurrency(summary.totalBudgetedExpenses)} />
        <MetricCard
          title="Real"
          tone={summary.totalActualExpenses > summary.totalBudgetedExpenses ? "danger" : "success"}
          value={formatCurrency(summary.totalActualExpenses)}
        />
        <MetricCard
          title="Diferencia"
          tone={summary.totalActualExpenses > summary.totalBudgetedExpenses ? "danger" : "success"}
          value={formatCurrency(summary.totalActualExpenses - summary.totalBudgetedExpenses)}
        />
      </div>

      <ExpenseForm
        key={`${editExpense?.id ?? "new-expense"}-${selection.year}-${selection.month}`}
        accounts={budget.bankAccounts.map((account) => ({ id: account.id, name: account.name }))}
        budgetId={budgetId}
        categories={budget.categories.map((category) => ({ id: category.id, name: category.name }))}
        disabled={!access.canEdit}
        initialValues={
          editExpense
            ? {
                name: editExpense.name,
                responsibleName: editExpense.responsibleName,
                categoryId: editExpense.categoryId,
                amountBudgetedMonthly: Number(editExpense.amountBudgetedMonthly),
                amountQ1: Number(editExpense.amountQ1),
                amountQ2: Number(editExpense.amountQ2),
                bankAccountId: editExpense.bankAccountId ?? "",
                actualAmount: Number(editExpense.actualAmount),
                expenseDate: formatDateInput(editExpense.expenseDate),
                isRecurring: editExpense.isRecurring,
                notes: editExpense.notes ?? ""
              }
            : undefined
        }
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editExpense?.id}
        returnPath={returnPath}
      />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gasto</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Real</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium" data-label="Gasto">{expense.name}</TableCell>
                <TableCell data-label="Responsable">{expense.responsibleName}</TableCell>
                <TableCell data-label="Categoría">{expense.category.name}</TableCell>
                <TableCell data-label="Cuenta">{expense.bankAccount?.name ?? "Sin cuenta"}</TableCell>
                <TableCell data-label="Presupuesto">{formatCurrency(expense.amountBudgetedMonthly)}</TableCell>
                <TableCell data-label="Real">{formatCurrency(expense.actualAmount)}</TableCell>
                <TableCell data-label="Diferencia">{formatCurrency(expense.difference)}</TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge status={expense.status} />
                </TableCell>
                <TableCell className="text-right" data-label="">
                  {access.canEdit ? (
                    <RecordActions
                      budgetId={budgetId}
                      editHref={periodHref(basePath, selection.year, selection.month, { editExpense: expense.id })}
                      entity="expense"
                      recordId={expense.id}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
