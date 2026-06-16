import { CopyPlus } from "lucide-react";
import { notFound } from "next/navigation";

import { DashboardCharts } from "@/components/dashboard-charts";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { copyNextPeriodAction } from "@/lib/actions";
import { requireBudgetAccess } from "@/lib/authorization";
import { getBudgetWorkspaceData, selectActivePeriod, selectPreviousPeriod } from "@/lib/data";
import { buildBudgetSummary, comparePeriods } from "@/lib/finance";
import { formatCurrency, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
};

export default async function HistoryPage({ params }: PageProps) {
  const { budgetId } = await params;
  const access = await requireBudgetAccess(budgetId);
  const budget = await getBudgetWorkspaceData(budgetId);
  if (!budget) notFound();
  const activePeriod = selectActivePeriod(budget.periods);
  const previousPeriod = selectPreviousPeriod(budget.periods, activePeriod);
  const activeSummary = activePeriod ? buildBudgetSummary(activePeriod) : undefined;
  const previousSummary = previousPeriod ? buildBudgetSummary(previousPeriod) : undefined;
  const comparison = activeSummary ? comparePeriods(activeSummary, previousSummary) : undefined;
  const historyData = [...budget.periods]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((period) => {
      const summary = buildBudgetSummary(period);
      return {
        label: `${period.month}/${period.year}`,
        ingresos: summary.totalIncomeReceived,
        gastos: summary.totalActualExpenses,
        ahorro: summary.totalSavingContributed
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Historial mensual</p>
          <h2 className="text-2xl font-semibold tracking-normal">Comparación de periodos</h2>
        </div>
        {access.canEdit ? (
          <form action={copyNextPeriodAction.bind(null, budgetId)}>
            <Button type="submit">
              <CopyPlus aria-hidden="true" className="h-4 w-4" />
              Copiar mes siguiente
            </Button>
          </form>
        ) : null}
      </div>

      {comparison ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <MetricCard title="Delta ingresos reales" value={formatCurrency(comparison.incomeDelta)} />
          <MetricCard title="Delta gastos" tone={comparison.expensesDelta > 0 ? "warning" : "success"} value={formatCurrency(comparison.expensesDelta)} />
          <MetricCard title="Delta ahorro" tone={comparison.savingDelta >= 0 ? "success" : "danger"} value={formatCurrency(comparison.savingDelta)} />
          <MetricCard title="Delta disponible" tone={comparison.availableDelta >= 0 ? "success" : "danger"} value={formatCurrency(comparison.availableDelta)} />
        </div>
      ) : null}

      <DashboardCharts categoryData={[]} budgetVsActual={[]} historyData={historyData} />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Ingresos reales</TableHead>
              <TableHead>Gastos reales</TableHead>
              <TableHead>Ahorro aportado</TableHead>
              <TableHead>Disponible real</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budget.periods.map((period) => {
              const summary = buildBudgetSummary(period);
              return (
                <TableRow key={period.id}>
                  <TableCell className="font-medium" data-label="Periodo">{periodLabel(period.year, period.month)}</TableCell>
                  <TableCell data-label="Estado">
                    <StatusBadge status={period.status} />
                  </TableCell>
                  <TableCell data-label="Ingresos reales">{formatCurrency(summary.totalIncomeReceived)}</TableCell>
                  <TableCell data-label="Gastos reales">{formatCurrency(summary.totalActualExpenses)}</TableCell>
                  <TableCell data-label="Ahorro aportado">{formatCurrency(summary.totalSavingContributed)}</TableCell>
                  <TableCell data-label="Disponible real">{formatCurrency(summary.availableBalanceReal)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
