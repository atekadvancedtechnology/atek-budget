import { notFound } from "next/navigation";

import { DebtHealthPanel } from "@/components/debt-health-panel";
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

export default async function DebtsPage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { budget, selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/debts`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));
  const returnPath = periodHref(basePath, selection.year, selection.month);
  const editDebt = selectedPeriod?.debts.find((debt) => debt.id === query?.editDebt);
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
  const debtHealthDebts = selectedPeriod?.debts.map((debt) => ({
    id: debt.id,
    name: debt.name,
    entity: debt.entity,
    pendingBalance: Number(debt.pendingBalance),
    monthlyPayment: Number(debt.monthlyPayment),
    annualInterestRate: Number(debt.annualInterestRate),
    remainingMonths: debt.remainingMonths,
    status: debt.status
  })) ?? [];

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

      <DebtHealthPanel
        debts={debtHealthDebts}
        periodMonth={selection.month}
        periodYear={selection.year}
        totalDebtPayments={summary.totalDebtMonthlyPayments}
        totalIncome={summary.totalIncomeExpected}
      />

      <DebtForm
        key={`${editDebt?.id ?? "new-debt"}-${selection.year}-${selection.month}`}
        budgetId={budgetId}
        currencies={currencyOptions}
        disabled={!access.canEdit}
        initialValues={
          editDebt
            ? {
                name: editDebt.name,
                entity: editDebt.entity,
                responsibleMemberId: editDebt.responsibleMemberId ?? "",
                responsibleName: editDebt.responsibleName,
                currencyId: editDebt.currencyId ?? "",
                exchangeRateToDop: Number(editDebt.exchangeRateToDop),
                pendingBalance: Number(editDebt.pendingBalanceOriginal),
                monthlyPayment: Number(editDebt.monthlyPaymentOriginal),
                annualInterestRate: Number(editDebt.annualInterestRate),
                remainingMonths: editDebt.remainingMonths,
                strategy: editDebt.strategy,
                notes: editDebt.notes ?? ""
              }
            : undefined
        }
        members={memberOptions}
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
              <TableHead>Saldo DOP</TableHead>
              <TableHead>Cuota DOP</TableHead>
              <TableHead>Original</TableHead>
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
                <TableCell data-label="Responsable">{responsibleLabel(debt)}</TableCell>
                <TableCell data-label="Saldo DOP">{formatCurrency(debt.pendingBalance)}</TableCell>
                <TableCell data-label="Cuota DOP">{formatCurrency(debt.monthlyPayment)}</TableCell>
                <TableCell data-label="Original">{formatCurrency(debt.pendingBalanceOriginal, debt.currencySymbol)} {debt.currencyCode}</TableCell>
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
                      canReopenDebt
                      editHref={periodHref(basePath, selection.year, selection.month, { editDebt: debt.id })}
                      entity="debt"
                      isPaidDisabled={debt.status !== "ACTIVE"}
                      isReopenDisabled={debt.status !== "PAID"}
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
