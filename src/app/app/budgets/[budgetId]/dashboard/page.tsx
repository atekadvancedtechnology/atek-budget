import { AlertTriangle, Landmark, PiggyBank, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { notFound } from "next/navigation";

import { DashboardCharts } from "@/components/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, selectPreviousPeriod } from "@/lib/data";
import { buildBudgetSummary, buildCategoryBreakdown } from "@/lib/finance";
import { formatCurrency, formatPercent, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    month?: string;
    year?: string;
  }>;
};

export default async function DashboardPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { budget, selection, selectedPeriod } = periodData;

  const basePath = `/app/budgets/${budgetId}/dashboard`;
  const periodForSummary = selectedPeriod ?? emptyPeriodInput(selection.year, selection.month);
  const previousPeriod = selectPreviousPeriod(budget.periods, selectedPeriod ?? { id: "selected", year: selection.year, month: selection.month });
  const summary = buildBudgetSummary(periodForSummary);
  const previousSummary = previousPeriod ? buildBudgetSummary(previousPeriod) : undefined;
  const breakdown = buildCategoryBreakdown(
    selectedPeriod?.expenses ?? [],
    budget.categories,
    summary.totalIncomeMonthly,
    selectedPeriod?.expensePayments ?? []
  );
  const historyData = [...budget.periods]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((period) => {
      const periodSummary = buildBudgetSummary(period);
      return {
        label: `${period.month}/${period.year}`,
        ingresos: periodSummary.totalIncomeReceived,
        gastos: periodSummary.totalActualExpenses,
        ahorro: periodSummary.totalSavingContributed
      };
    });

  const previousExpenseDelta = previousSummary
    ? summary.totalActualExpenses - previousSummary.totalActualExpenses
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Dashboard financiero</p>
          <h2 className="text-2xl font-semibold tracking-normal">
            {periodLabel(selection.year, selection.month)}
          </h2>
        </div>
        <StatusBadge status={selectedPeriod?.status ?? "DRAFT"} />
      </div>

      <PeriodSelector
        basePath={basePath}
        hasPeriod={Boolean(selectedPeriod)}
        month={selection.month}
        status={selectedPeriod?.status}
        year={selection.year}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`Real recibido: ${formatCurrency(summary.totalIncomeReceived)}`}
          icon={<Wallet className="h-4 w-4" />}
          title="Ingresos estimados"
          tone="info"
          value={formatCurrency(summary.totalIncomeMonthly)}
        />
        <MetricCard
          detail={`${formatPercent(summary.expensePercentOfIncome)} del ingreso`}
          icon={<ReceiptText className="h-4 w-4" />}
          title="Gastos reales"
          tone={summary.totalActualExpenses > summary.totalBudgetedExpenses ? "danger" : "success"}
          value={formatCurrency(summary.totalActualExpenses)}
        />
        <MetricCard
          detail={`${formatPercent(summary.savingPercentOfIncome)} del ingreso`}
          icon={<PiggyBank className="h-4 w-4" />}
          title="Ahorro aportado"
          tone="success"
          value={formatCurrency(summary.totalSavingContributed)}
        />
        <MetricCard
          detail={`${formatPercent(summary.debtPaymentPercentOfIncome)} del ingreso`}
          icon={<Landmark className="h-4 w-4" />}
          title="Cuotas de deuda"
          tone={summary.debtPaymentPercentOfIncome > 35 ? "warning" : "neutral"}
          value={formatCurrency(summary.totalDebtMonthlyPayments)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail="Ingresos recibidos - gastos reales - ahorro aportado - cuotas de deuda"
          icon={<TrendingUp className="h-4 w-4" />}
          title="Disponible real"
          tone={summary.availableBalanceReal >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.availableBalanceReal)}
        />
        <MetricCard
          detail="Ingreso Q1 - gastos Q1 - 50% ahorro - 50% deuda"
          title="Resto quincena 1"
          tone={summary.availableBalanceQ1 >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.availableBalanceQ1)}
        />
        <MetricCard
          detail="Ingreso Q2 - gastos Q2 - 50% ahorro - 50% deuda"
          title="Resto quincena 2"
          tone={summary.availableBalanceQ2 >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.availableBalanceQ2)}
        />
        <MetricCard
          detail={
            previousSummary
              ? `${previousExpenseDelta >= 0 ? "+" : ""}${formatCurrency(previousExpenseDelta)} vs mes anterior`
              : "Sin mes anterior"
          }
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Estado general"
          tone={summary.generalStatusReal === "OK" ? "success" : "danger"}
          value={summary.generalStatusReal === "OK" ? "Dentro del ingreso real" : "Sobre ingreso real"}
        />
      </div>

      <DashboardCharts
        budgetVsActual={breakdown
          .filter((item) => item.budgeted > 0 || item.actual > 0)
          .map((item) => ({ name: item.categoryName, presupuesto: item.budgeted, real: item.actual }))}
        categoryData={breakdown
          .filter((item) => item.actual > 0)
          .map((item) => ({ name: item.categoryName, actual: item.actual, budgeted: item.budgeted }))}
        historyData={historyData}
      />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Presupuesto</TableHead>
              <TableHead>Real</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>% ingreso</TableHead>
              <TableHead>Meta máx.</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((item) => (
              <TableRow key={item.categoryId}>
                <TableCell className="font-medium" data-label="Categoría">{item.categoryName}</TableCell>
                <TableCell data-label="Presupuesto">{formatCurrency(item.budgeted)}</TableCell>
                <TableCell data-label="Real">{formatCurrency(item.actual)}</TableCell>
                <TableCell data-label="Diferencia">{formatCurrency(item.difference)}</TableCell>
                <TableCell data-label="% ingreso">{formatPercent(item.percentOfIncome)}</TableCell>
                <TableCell data-label="Meta máx.">{formatPercent(item.recommendedMaxPercent)}</TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
