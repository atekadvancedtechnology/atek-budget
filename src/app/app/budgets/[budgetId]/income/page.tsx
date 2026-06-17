import { notFound } from "next/navigation";

import { IncomeForm, IncomeReceiptForm } from "@/components/forms";
import { MetricCard } from "@/components/metric-card";
import { PeriodSelector } from "@/components/period-selector";
import { RecordActions } from "@/components/record-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { emptyPeriodInput, getBudgetWorkspaceDataForPeriod, periodHref } from "@/lib/data";
import {
  buildBudgetSummary,
  estimateAnnualIncome,
  estimateMonthlyIncome,
  expectedIncomeForPeriod,
  receivedIncomeForIncome,
  safePercent
} from "@/lib/finance";
import { formatCurrency, formatPercent, periodLabel } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
  searchParams?: Promise<{
    editIncome?: string;
    editReceipt?: string;
    month?: string;
    year?: string;
  }>;
};

const amountTypeLabels: Record<string, string> = {
  FIXED: "Fijo",
  VARIABLE: "Variable",
  ESTIMATED: "Estimado"
};

const frequencyLabels: Record<string, string> = {
  ONE_TIME: "Único",
  DAILY: "Diario",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
  BIMONTHLY: "Bimestral",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual",
  IRREGULAR: "Irregular",
  CUSTOM: "Personalizado"
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function formatDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
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

export default async function IncomePage({ params, searchParams }: PageProps) {
  const { budgetId } = await params;
  const query = await searchParams;
  const access = await requireBudgetAccess(budgetId);
  const periodData = await getBudgetWorkspaceDataForPeriod(budgetId, query, access.user.id);
  if (!periodData) notFound();
  const { budget, selection, selectedPeriod } = periodData;
  const basePath = `/app/budgets/${budgetId}/income`;
  const summary = buildBudgetSummary(selectedPeriod ?? emptyPeriodInput(selection.year, selection.month));
  const returnPath = periodHref(basePath, selection.year, selection.month);
  const editIncome = selectedPeriod?.incomes.find((income) => income.id === query?.editIncome);
  const editReceipt = selectedPeriod?.incomeReceipts.find((receipt) => receipt.id === query?.editReceipt);
  const editReceiptIncome = editReceipt?.income;
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
        <p className="text-sm text-muted-foreground">Ingresos</p>
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Mensual estimado" tone="info" value={formatCurrency(summary.totalIncomeMonthly)} />
        <MetricCard title="Anual estimado" value={formatCurrency(summary.totalIncomeAnnualEstimated)} />
        <MetricCard title="Esperado del mes" value={formatCurrency(summary.totalIncomeExpected)} />
        <MetricCard title="Real recibido" tone="success" value={formatCurrency(summary.totalIncomeReceived)} />
        <MetricCard
          title="Diferencia"
          tone={summary.incomeVariance >= 0 ? "success" : "danger"}
          value={formatCurrency(summary.incomeVariance)}
        />
      </div>

      <IncomeForm
        key={`${editIncome?.id ?? "new-income"}-${selection.year}-${selection.month}`}
        budgetId={budgetId}
        currencies={currencyOptions}
        disabled={!access.canEdit}
        initialValues={
          editIncome
            ? {
                responsibleMemberId: editIncome.responsibleMemberId ?? "",
                responsibleName: editIncome.responsibleName,
                currencyId: editIncome.currencyId ?? "",
                exchangeRateToDop: Number(editIncome.exchangeRateToDop),
                source: editIncome.source,
                amount: Number(editIncome.amountOriginal),
                amountType: editIncome.amountType,
                frequency: editIncome.frequency,
                startDate: formatDateInput(editIncome.startDate),
                endDate: formatDateInput(editIncome.endDate),
                customRule: editIncome.customRule ?? "",
                expectedPaymentDays: editIncome.expectedPaymentDays.join(", "),
                isActive: editIncome.isActive,
                notes: editIncome.notes ?? ""
              }
            : undefined
        }
        members={memberOptions}
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editIncome?.id}
        returnPath={returnPath}
      />
      <IncomeReceiptForm
        key={`${editReceipt?.id ?? "new-receipt"}-${selection.year}-${selection.month}`}
        budgetId={budgetId}
        currencies={currencyOptions}
        disabled={!access.canEdit}
        initialValues={
          editReceipt
            ? {
                incomeId: editReceipt.incomeId ?? "",
                responsibleMemberId: editReceiptIncome?.responsibleMemberId ?? editReceipt.responsibleMemberId ?? "",
                responsibleName: editReceiptIncome?.responsibleName ?? editReceipt.responsibleName,
                currencyId: editReceipt.currencyId ?? editReceiptIncome?.currencyId ?? "",
                exchangeRateToDop: Number(editReceipt.exchangeRateToDop),
                source: editReceiptIncome?.source ?? editReceipt.source,
                amount: Number(editReceipt.amountOriginal),
                receivedDate: formatDateInput(editReceipt.receivedDate),
                notes: editReceipt.notes ?? ""
              }
            : undefined
        }
        incomes={selectedPeriod?.incomes.map((income) => ({
          id: income.id,
          responsibleMemberId: income.responsibleMemberId,
          responsibleName: income.responsibleName,
          source: income.source,
          currencyId: income.currencyId,
          exchangeRateToDop: Number(income.exchangeRateToDop)
        })) ?? []}
        members={memberOptions}
        periodMonth={selection.month}
        periodYear={selection.year}
        recordId={editReceipt?.id}
        returnPath={returnPath}
      />

      <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Responsable</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Monto DOP</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Días pago</TableHead>
              <TableHead>Mensual est.</TableHead>
              <TableHead>Esperado mes</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead>Diferencia</TableHead>
              <TableHead>% familiar</TableHead>
              <TableHead>Anual estimado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.incomes.map((income) => {
              const monthlyEstimate = estimateMonthlyIncome(income);
              const expectedMonth = expectedIncomeForPeriod(income, selection.year, selection.month);
              const received = receivedIncomeForIncome(income);
              return (
                <TableRow key={income.id}>
                  <TableCell className="font-medium" data-label="Responsable">{responsibleLabel(income)}</TableCell>
                  <TableCell data-label="Fuente">{income.source}</TableCell>
                  <TableCell data-label="Monto DOP">{formatCurrency(income.amount)}</TableCell>
                  <TableCell data-label="Original">{formatCurrency(income.amountOriginal, income.currencySymbol)} {income.currencyCode}</TableCell>
                  <TableCell data-label="Tipo">{amountTypeLabels[income.amountType]}</TableCell>
                  <TableCell data-label="Frecuencia">{frequencyLabels[income.frequency]}</TableCell>
                  <TableCell data-label="Inicio">{formatDate(income.startDate)}</TableCell>
                  <TableCell data-label="Días pago">{income.expectedPaymentDays.length > 0 ? income.expectedPaymentDays.join(", ") : "Flexible"}</TableCell>
                  <TableCell data-label="Mensual est.">{formatCurrency(monthlyEstimate)}</TableCell>
                  <TableCell data-label="Esperado mes">{formatCurrency(expectedMonth)}</TableCell>
                  <TableCell data-label="Recibido">{formatCurrency(received)}</TableCell>
                  <TableCell data-label="Diferencia">{formatCurrency(received - expectedMonth)}</TableCell>
                  <TableCell data-label="% familiar">{formatPercent(safePercent(monthlyEstimate, summary.totalIncomeMonthly))}</TableCell>
                  <TableCell data-label="Anual estimado">{formatCurrency(estimateAnnualIncome(income))}</TableCell>
                  <TableCell data-label="Estado">
                    <Badge tone={income.isActive ? "success" : "neutral"}>{income.isActive ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right" data-label="">
                    {access.canEdit ? (
                      <RecordActions
                        budgetId={budgetId}
                        editHref={periodHref(basePath, selection.year, selection.month, { editIncome: income.id })}
                        entity="income"
                        recordId={income.id}
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
              <TableHead>Fecha recibida</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Fuente</TableHead>
              <TableHead>Monto DOP</TableHead>
              <TableHead>Original</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPeriod?.incomeReceipts.map((receipt) => {
              const responsibleName = receipt.income ? responsibleLabel(receipt.income) : responsibleLabel(receipt);
              const source = receipt.income?.source ?? receipt.source;

              return (
                <TableRow key={receipt.id}>
                  <TableCell data-label="Fecha recibida">{formatDate(receipt.receivedDate)}</TableCell>
                  <TableCell className="font-medium" data-label="Responsable">{responsibleName}</TableCell>
                  <TableCell data-label="Fuente">{source}</TableCell>
                  <TableCell data-label="Monto DOP">{formatCurrency(receipt.amount)}</TableCell>
                  <TableCell data-label="Original">{formatCurrency(receipt.amountOriginal, receipt.currencySymbol)} {receipt.currencyCode}</TableCell>
                  <TableCell data-label="Notas">{receipt.notes ?? ""}</TableCell>
                  <TableCell className="text-right" data-label="">
                    {access.canEdit ? (
                      <RecordActions
                        budgetId={budgetId}
                        editHref={periodHref(basePath, selection.year, selection.month, { editReceipt: receipt.id })}
                        entity="incomeReceipt"
                        recordId={receipt.id}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
