import { notFound } from "next/navigation";

import { CashflowChart } from "@/components/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod } from "@/lib/data";
import { buildBudgetSummary, expectedIncomeByFortnight, sum } from "@/lib/finance";
import { formatCurrency, periodLabel } from "@/lib/format";

type ResponsibleRecord = {
  responsibleName: string;
  responsibleMemberId?: string | null;
  responsibleMember?: {
    user: {
      name: string | null;
      email: string | null;
    };
  } | null;
};

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
};

function responsibleKey(record: ResponsibleRecord) {
  return record.responsibleMemberId ?? `legacy:${record.responsibleName}`;
}

function responsibleLabel(record: ResponsibleRecord) {
  return record.responsibleMember?.user.name || record.responsibleMember?.user.email || record.responsibleName;
}

export default async function CashflowPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/cashflow`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));

  const responsibles = selectedPeriod
    ? Array.from(
        [
          ...selectedPeriod.incomes,
          ...selectedPeriod.expenses,
          ...selectedPeriod.debts.filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED")
        ].reduce((map, record) => {
          const key = responsibleKey(record);
          if (!map.has(key)) map.set(key, responsibleLabel(record));
          return map;
        }, new Map<string, string>()),
        ([key, name]) => ({ key, name })
      )
    : [];
  const savingPerResponsible = responsibles.length > 0 ? summary.totalSavingPlanned / responsibles.length : 0;
  const rows = selectedPeriod
    ? [
        ...responsibles.map((responsible) => {
          const personIncomes = selectedPeriod.incomes.filter((income) => responsibleKey(income) === responsible.key);
          const incomeQ1 = sum(
            personIncomes.map((income) => expectedIncomeByFortnight(income, selection.year, selection.month).q1)
          );
          const incomeQ2 = sum(
            personIncomes.map((income) => expectedIncomeByFortnight(income, selection.year, selection.month).q2)
          );
          const expenseQ1 = sum(selectedPeriod.expenses.filter((expense) => responsibleKey(expense) === responsible.key).map((expense) => expense.amountQ1));
          const expenseQ2 = sum(selectedPeriod.expenses.filter((expense) => responsibleKey(expense) === responsible.key).map((expense) => expense.amountQ2));
          const debtMonthlyPayment = sum(
            selectedPeriod.debts
              .filter((debt) => responsibleKey(debt) === responsible.key)
              .filter((debt) => debt.status !== "PAID" && debt.status !== "CANCELLED")
              .map((debt) => debt.monthlyPayment)
          );
          const debtQ1 = debtMonthlyPayment / 2;
          const debtQ2 = debtMonthlyPayment / 2;
          const savingQ1 = savingPerResponsible / 2;
          const savingQ2 = savingPerResponsible / 2;
          return {
            name: responsible.name,
            ingresoQ1: incomeQ1,
            gastoQ1: expenseQ1,
            deudaQ1: debtQ1,
            ahorroQ1: savingQ1,
            restoQ1: incomeQ1 - expenseQ1 - debtQ1 - savingQ1,
            ingresoQ2: incomeQ2,
            gastoQ2: expenseQ2,
            deudaQ2: debtQ2,
            ahorroQ2: savingQ2,
            restoQ2: incomeQ2 - expenseQ2 - debtQ2 - savingQ2
          };
        }),
        {
          name: "Familia",
          ingresoQ1: summary.totalIncomeQ1,
          gastoQ1: sum(selectedPeriod.expenses.map((expense) => expense.amountQ1)),
          deudaQ1: summary.totalDebtMonthlyPayments / 2,
          ahorroQ1: summary.totalSavingPlanned / 2,
          restoQ1: summary.availableBalanceQ1,
          ingresoQ2: summary.totalIncomeQ2,
          gastoQ2: sum(selectedPeriod.expenses.map((expense) => expense.amountQ2)),
          deudaQ2: summary.totalDebtMonthlyPayments / 2,
          ahorroQ2: summary.totalSavingPlanned / 2,
          restoQ2: summary.availableBalanceQ2
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Flujo de caja quincenal</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          title="Resto quincena 1"
          tone={summary.availableBalanceQ1 >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.availableBalanceQ1)}
        />
        <MetricCard
          title="Resto quincena 2"
          tone={summary.availableBalanceQ2 >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.availableBalanceQ2)}
        />
      </div>

      <CashflowChart data={rows} />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Responsable</TableHead>
              <TableHead>Ingreso Q1</TableHead>
              <TableHead>Gasto Q1</TableHead>
              <TableHead>Deuda Q1</TableHead>
              <TableHead>Ahorro Q1</TableHead>
              <TableHead>Resto Q1</TableHead>
              <TableHead>Ingreso Q2</TableHead>
              <TableHead>Gasto Q2</TableHead>
              <TableHead>Deuda Q2</TableHead>
              <TableHead>Ahorro Q2</TableHead>
              <TableHead>Resto Q2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium" data-label="Responsable">{row.name}</TableCell>
                <TableCell data-label="Ingreso Q1">{formatCurrency(row.ingresoQ1)}</TableCell>
                <TableCell data-label="Gasto Q1">{formatCurrency(row.gastoQ1)}</TableCell>
                <TableCell data-label="Deuda Q1">{formatCurrency(row.deudaQ1)}</TableCell>
                <TableCell data-label="Ahorro Q1">{formatCurrency(row.ahorroQ1)}</TableCell>
                <TableCell data-label="Resto Q1">{formatCurrency(row.restoQ1)}</TableCell>
                <TableCell data-label="Ingreso Q2">{formatCurrency(row.ingresoQ2)}</TableCell>
                <TableCell data-label="Gasto Q2">{formatCurrency(row.gastoQ2)}</TableCell>
                <TableCell data-label="Deuda Q2">{formatCurrency(row.deudaQ2)}</TableCell>
                <TableCell data-label="Ahorro Q2">{formatCurrency(row.ahorroQ2)}</TableCell>
                <TableCell data-label="Resto Q2">{formatCurrency(row.restoQ2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
