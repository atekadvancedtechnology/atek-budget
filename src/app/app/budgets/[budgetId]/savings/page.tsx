import { notFound } from "next/navigation";

import { SavingGoalForm } from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { RecordActions } from "@/components/record-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, periodHref } from "@/lib/data";
import { buildBudgetSummary, emergencyFundProgress, savingGoalProgress } from "@/lib/finance";
import { formatCurrency, formatPercent, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    editSaving?: string;
    month?: string;
    year?: string;
  }>;
};

export default async function SavingsPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { budget, selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/savings`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));
  const emergencyProgress = emergencyFundProgress(budget.emergencyFundCurrent, budget.emergencyFundTarget);
  const returnPath = periodHref(basePath, selection.year, selection.month);
  const editSaving = selectedPeriod?.savingGoals.find((goal) => goal.id === query?.editSaving);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Ahorros</p>
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

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard title="Programado" value={formatCurrency(summary.totalSavingPlanned)} />
        <MetricCard title="Aportado" tone="success" value={formatCurrency(summary.totalSavingContributed)} />
        <MetricCard title="% de ingreso" value={formatPercent(summary.savingPercentOfIncome)} />
        <MetricCard
          detail={`${formatCurrency(budget.emergencyFundCurrent)} de ${formatCurrency(budget.emergencyFundTarget)}`}
          title="Fondo emergencia"
          tone={emergencyProgress >= 100 ? "success" : "info"}
          value={formatPercent(emergencyProgress)}
        />
      </div>

      <SavingGoalForm
        key={`${editSaving?.id ?? "new-saving"}-${selection.year}-${selection.month}`}
        budgetId={budgetId}
        disabled={!access.canEdit}
        initialValues={
          editSaving
            ? {
                name: editSaving.name,
                monthlyTarget: Number(editSaving.monthlyTarget),
                contributedThisMonth: Number(editSaving.contributedThisMonth),
                accumulatedBalance: Number(editSaving.accumulatedBalance),
                institution: editSaving.institution,
                priority: editSaving.priority,
                notes: editSaving.notes ?? ""
              }
            : undefined
        }
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editSaving?.id}
        returnPath={returnPath}
      />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destino</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Meta mensual</TableHead>
              <TableHead>Aportado</TableHead>
              <TableHead>Acumulado</TableHead>
              <TableHead>Cumplimiento</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.savingGoals.map((goal) => (
              <TableRow key={goal.id}>
                <TableCell className="font-medium" data-label="Destino">{goal.name}</TableCell>
                <TableCell data-label="Institución">{goal.institution}</TableCell>
                <TableCell data-label="Meta mensual">{formatCurrency(goal.monthlyTarget)}</TableCell>
                <TableCell data-label="Aportado">{formatCurrency(goal.contributedThisMonth)}</TableCell>
                <TableCell data-label="Acumulado">{formatCurrency(goal.accumulatedBalance)}</TableCell>
                <TableCell data-label="Cumplimiento">
                  <div className="min-w-32">
                    <div className="mb-1 text-sm">{formatPercent(savingGoalProgress(goal.contributedThisMonth, goal.monthlyTarget))}</div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${savingGoalProgress(goal.contributedThisMonth, goal.monthlyTarget)}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell data-label="Prioridad">{goal.priority}</TableCell>
                <TableCell className="text-right" data-label="">
                  {access.canEdit ? (
                    <RecordActions
                      budgetId={budgetId}
                      editHref={periodHref(basePath, selection.year, selection.month, { editSaving: goal.id })}
                      entity="savingGoal"
                      recordId={goal.id}
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
