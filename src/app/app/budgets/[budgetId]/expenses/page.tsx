import { notFound } from "next/navigation";

import { ExpenseForm, ExpensePaymentForm } from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { RecordActions } from "@/components/record-actions";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, periodHref } from "@/lib/data";
import { actualExpenseAmount, buildBudgetSummary, calculateExpenseDifference, calculateExpenseStatus } from "@/lib/finance";
import { formatCurrency, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    editExpense?: string;
    editPayment?: string;
    month?: string;
    year?: string;
  }>;
};

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function responsibleLabel(record: {
  responsibleName: string;
  responsibleMember?: {
    user: {
      name: string | null;
      email: string | null;
    };
  } | null;
}) {
  return record.responsibleMember?.user.name || record.responsibleMember?.user.email || record.responsibleName;
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
  const editPayment = selectedPeriod?.expensePayments.find((payment) => payment.id === query?.editPayment);
  const memberOptions = budget.workspace.members.map((member) => ({
    id: member.id,
    name: member.user.name || member.user.email || "Miembro"
  }));
  const currencyOptions = budget.currencies.filter((currency) => currency.isActive).map((currency) => ({
    id: currency.id,
    code: currency.code,
    name: currency.name,
    symbol: currency.symbol,
    defaultRateToDop: Number(currency.defaultRateToDop),
    isBase: currency.isBase
  }));

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
        currencies={currencyOptions}
        disabled={!access.canEdit}
        initialValues={
          editExpense
            ? {
                name: editExpense.name,
                responsibleMemberId: editExpense.responsibleMemberId ?? "",
                responsibleName: editExpense.responsibleName,
                categoryId: editExpense.categoryId,
                currencyId: editExpense.currencyId ?? "",
                exchangeRateToDop: Number(editExpense.exchangeRateToDop),
                amountType: editExpense.amountType,
                amountBudgetedMonthly: Number(editExpense.amountBudgetedOriginal),
                amountQ1: Number(editExpense.amountQ1Original),
                amountQ2: Number(editExpense.amountQ2Original),
                bankAccountId: editExpense.bankAccountId ?? "",
                isRecurring: editExpense.isRecurring,
                notes: editExpense.notes ?? ""
              }
            : undefined
        }
        members={memberOptions}
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editExpense?.id}
        returnPath={returnPath}
      />
      <ExpensePaymentForm
        key={`${editPayment?.id ?? "new-expense-payment"}-${selection.year}-${selection.month}`}
        accounts={budget.bankAccounts.map((account) => ({ id: account.id, name: account.name }))}
        budgetId={budgetId}
        categories={budget.categories.map((category) => ({ id: category.id, name: category.name }))}
        currencies={currencyOptions}
        disabled={!access.canEdit}
        expenses={selectedPeriod?.expenses.map((expense) => ({
          id: expense.id,
          name: expense.name,
          responsibleMemberId: expense.responsibleMemberId,
          responsibleName: expense.responsibleName,
          categoryId: expense.categoryId,
          bankAccountId: expense.bankAccountId,
          currencyId: expense.currencyId,
          exchangeRateToDop: Number(expense.exchangeRateToDop)
        })) ?? []}
        initialValues={
          editPayment
            ? {
                expenseId: editPayment.expenseId ?? "",
                name: editPayment.expense?.name ?? editPayment.name,
                responsibleMemberId: editPayment.expense?.responsibleMemberId ?? editPayment.responsibleMemberId ?? "",
                responsibleName: editPayment.expense?.responsibleName ?? editPayment.responsibleName,
                categoryId: editPayment.expense?.categoryId ?? editPayment.categoryId,
                bankAccountId: editPayment.expense?.bankAccountId ?? editPayment.bankAccountId ?? "",
                currencyId: editPayment.currencyId ?? editPayment.expense?.currencyId ?? "",
                exchangeRateToDop: Number(editPayment.exchangeRateToDop),
                amount: Number(editPayment.amountOriginal),
                paidDate: formatDateInput(editPayment.paidDate),
                notes: editPayment.notes ?? ""
              }
            : undefined
        }
        members={memberOptions}
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editPayment?.id}
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
              <TableHead>Presupuesto DOP</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Real</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.expenses.map((expense) => {
              const actualAmount = actualExpenseAmount(expense);
              const difference = calculateExpenseDifference(actualAmount, expense.amountBudgetedMonthly);
              const status = calculateExpenseStatus(actualAmount, expense.amountBudgetedMonthly);

              return (
              <TableRow key={expense.id}>
                <TableCell className="font-medium" data-label="Gasto">{expense.name}</TableCell>
                <TableCell data-label="Responsable">{responsibleLabel(expense)}</TableCell>
                <TableCell data-label="Categoría">{expense.category.name}</TableCell>
                <TableCell data-label="Cuenta">{expense.bankAccount?.name ?? "Sin cuenta"}</TableCell>
                <TableCell data-label="Presupuesto DOP">{formatCurrency(expense.amountBudgetedMonthly)}</TableCell>
                <TableCell data-label="Original">{formatCurrency(expense.amountBudgetedOriginal, expense.currencySymbol)} {expense.currencyCode}</TableCell>
                <TableCell data-label="Real">{formatCurrency(actualAmount)}</TableCell>
                <TableCell data-label="Diferencia">{formatCurrency(difference)}</TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge status={status} />
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Gasto</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>CategorÃ­a</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Monto DOP</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.expensePayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell data-label="Fecha">{formatDate(payment.paidDate)}</TableCell>
                <TableCell className="font-medium" data-label="Gasto">{payment.expense?.name ?? payment.name}</TableCell>
                <TableCell data-label="Responsable">{payment.expense ? responsibleLabel(payment.expense) : responsibleLabel(payment)}</TableCell>
                <TableCell data-label="CategorÃ­a">{payment.category.name}</TableCell>
                <TableCell data-label="Cuenta">{payment.bankAccount?.name ?? "Sin cuenta"}</TableCell>
                <TableCell data-label="Monto DOP">{formatCurrency(payment.amount)}</TableCell>
                <TableCell data-label="Original">{formatCurrency(payment.amountOriginal, payment.currencySymbol)} {payment.currencyCode}</TableCell>
                <TableCell data-label="Notas">{payment.notes ?? ""}</TableCell>
                <TableCell className="text-right" data-label="">
                  {access.canEdit ? (
                    <RecordActions
                      budgetId={budgetId}
                      editHref={periodHref(basePath, selection.year, selection.month, { editPayment: payment.id })}
                      entity="expensePayment"
                      recordId={payment.id}
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
