import { notFound } from "next/navigation";

import { DebtForm } from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { RecordActions } from "@/components/record-actions";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, periodHref } from "@/lib/data";
import { buildBudgetSummary } from "@/lib/finance";
import { formatCurrency, formatPercent, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    editDebt?: string;
    month?: string;
    year?: string;
  }>;
};

const strategyLabels: Record<string, string> = {
  AVALANCHE: "Avalancha",
  SNOWBALL: "Bola de nieve",
  CUSTOM: "Personalizada"
};

export default async function DebtsPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/debts`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));
  const returnPath = periodHref(basePath, selection.year, selection.month);
  const editDebt = selectedPeriod?.debts.find((debt) => debt.id === query?.editDebt);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Deudas</p>
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
        <MetricCard title="Saldo pendiente" tone="warning" value={formatCurrency(summary.totalDebtPending)} />
        <MetricCard title="Cuotas mensuales" value={formatCurrency(summary.totalDebtMonthlyPayments)} />
        <MetricCard
          detail={summary.debtPaymentPercentOfIncome > 35 ? "Revisar: supera el 35% recomendado." : "Dentro del umbral recomendado."}
          title="% de ingreso"
          tone={summary.debtPaymentPercentOfIncome > 35 ? "danger" : "success"}
          value={formatPercent(summary.debtPaymentPercentOfIncome)}
        />
      </div>

      <DebtForm
        key={`${editDebt?.id ?? "new-debt"}-${selection.year}-${selection.month}`}
        budgetId={budgetId}
        disabled={!access.canEdit}
        initialValues={
          editDebt
            ? {
                name: editDebt.name,
                entity: editDebt.entity,
                responsibleName: editDebt.responsibleName,
                pendingBalance: Number(editDebt.pendingBalance),
                monthlyPayment: Number(editDebt.monthlyPayment),
                annualInterestRate: Number(editDebt.annualInterestRate),
                remainingMonths: editDebt.remainingMonths,
                strategy: editDebt.strategy,
                notes: editDebt.notes ?? ""
              }
            : undefined
        }
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editDebt?.id}
        returnPath={returnPath}
      />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deuda</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Interés est.</TableHead>
              <TableHead>Estrategia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.debts.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell className="font-medium" data-label="Deuda">{debt.name}</TableCell>
                <TableCell data-label="Entidad">{debt.entity}</TableCell>
                <TableCell data-label="Responsable">{debt.responsibleName}</TableCell>
                <TableCell data-label="Saldo">{formatCurrency(debt.pendingBalance)}</TableCell>
                <TableCell data-label="Cuota">{formatCurrency(debt.monthlyPayment)}</TableCell>
                <TableCell data-label="Interés est.">{formatCurrency(debt.estimatedTotalInterest)}</TableCell>
                <TableCell data-label="Estrategia">{strategyLabels[debt.strategy]}</TableCell>
                <TableCell data-label="Estado">
                  <StatusBadge status={debt.status} />
                </TableCell>
                <TableCell className="text-right" data-label="">
                  {access.canEdit ? (
                    <RecordActions
                      budgetId={budgetId}
                      canMarkPaid
                      editHref={periodHref(basePath, selection.year, selection.month, { editDebt: debt.id })}
                      entity="debt"
                      isPaidDisabled={debt.status !== "ACTIVE"}
                      recordId={debt.id}
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
