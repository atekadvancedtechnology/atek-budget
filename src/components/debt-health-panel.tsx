"use client";

import { AlertTriangle, Calculator, Target } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  calculateDebtHealth,
  simulateDebtExtraPayment,
  type DebtHealthDebt,
  type DebtHealthStatus
} from "@/lib/finance";
import { formatCurrency, formatPercent } from "@/lib/format";

type DebtHealthPanelProps = {
  debts: DebtHealthDebt[];
  periodMonth: number;
  periodYear: number;
  totalDebtPayments: number;
  totalIncome: number;
};

const statusTone: Record<DebtHealthStatus, "success" | "warning" | "danger" | "neutral"> = {
  healthy: "success",
  watch: "warning",
  high: "warning",
  veryHigh: "danger",
  critical: "danger"
};

const criticalRecommendations = [
  "No crear nuevas deudas.",
  "Pagar los minimos de todas las deudas.",
  "Priorizar deudas pequenas que liberen cuota mensual rapidamente.",
  "Luego priorizar las deudas con mayor interes.",
  "Reducir gastos no esenciales temporalmente."
];

export function DebtHealthPanel({
  debts,
  periodMonth,
  periodYear,
  totalDebtPayments,
  totalIncome
}: DebtHealthPanelProps) {
  const health = useMemo(
    () => calculateDebtHealth({ debts, periodMonth, periodYear, totalDebtPayments, totalIncome }),
    [debts, periodMonth, periodYear, totalDebtPayments, totalIncome]
  );
  const firstDebtId = health.impacts[0]?.debtId ?? "";
  const [selectedDebtId, setSelectedDebtId] = useState(firstDebtId);
  const [extraPayment, setExtraPayment] = useState("0");
  const selectedDebt = debts.find((debt) => debt.id === (selectedDebtId || firstDebtId));
  const simulation = selectedDebt
    ? simulateDebtExtraPayment({
        debt: selectedDebt,
        extraPayment,
        periodMonth,
        periodYear,
        totalDebtPayments,
        totalIncome
      })
    : undefined;

  return (
    <section className="space-y-4" aria-labelledby="debt-health-title">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle id="debt-health-title">Salud financiera de deudas</CardTitle>
                <CardDescription>
                  Cuotas de deuda del periodo divididas entre ingresos del periodo.
                </CardDescription>
              </div>
              <Badge tone={statusTone[health.status]}>{health.statusLabel}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border bg-background p-4">
                <p className="text-sm text-muted-foreground">Endeudamiento</p>
                <p className="mt-2 text-2xl font-semibold">{formatPercent(health.debtBurdenPercent)}</p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <p className="text-sm text-muted-foreground">Cuotas del periodo</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(health.totalDebtPayments)}</p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <p className="text-sm text-muted-foreground">Ingresos del periodo</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(health.totalIncome)}</p>
              </div>
            </div>

            {health.isCritical ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-destructive">Modo critico</p>
                      <p className="text-muted-foreground">
                        El endeudamiento supera el 75%. Conviene congelar nuevas deudas y liberar cuotas.
                      </p>
                    </div>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {criticalRecommendations.map((recommendation) => (
                        <li key={recommendation} className="rounded-md bg-background/80 px-3 py-2">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deuda recomendada</CardTitle>
            <CardDescription>Primero la menor que libere una cuota, luego mayor interes.</CardDescription>
          </CardHeader>
          <CardContent>
            {health.recommendedDebt ? (
              <div className="space-y-3">
                <div>
                  <p className="text-lg font-semibold">{health.recommendedDebt.name}</p>
                  <p className="text-sm text-muted-foreground">{health.recommendedDebt.entity}</p>
                </div>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Saldo</span>
                    <span className="font-medium">{formatCurrency(health.recommendedDebt.pendingBalance)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Cuota liberada</span>
                    <span className="font-medium">{formatCurrency(health.recommendedDebt.monthlyPayment)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Bajaria</span>
                    <span className="font-medium">{formatPercent(health.recommendedDebt.percentReduction)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Nuevo %</span>
                    <span className="font-medium">{formatPercent(health.recommendedDebt.newDebtBurdenPercent)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay deudas activas para recomendar.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Target className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>Meta por fases</CardTitle>
                <CardDescription>Bajar el porcentaje liberando cuota mensual comprometida.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {health.phases.map((phase) => (
                <div key={phase.targetPercent} className="rounded-md border bg-background p-4">
                  <p className="text-sm text-muted-foreground">Meta {formatPercent(phase.targetPercent)}</p>
                  <p className="mt-2 text-lg font-semibold">{formatCurrency(phase.maxDebtPayment)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Liberar {formatCurrency(phase.monthlyPaymentToFree)} de cuota.
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <Calculator className="mt-1 h-5 w-5 text-primary" />
              <div>
                <CardTitle>Simular pago extra</CardTitle>
                <CardDescription>Proyecta el balance y el endeudamiento si haces un abono.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
              <Select
                aria-label="Deuda a simular"
                value={selectedDebtId || firstDebtId}
                onChange={(event) => setSelectedDebtId(event.target.value)}
              >
                {health.impacts.map((debt) => (
                  <option key={debt.debtId} value={debt.debtId}>
                    {debt.name} - {debt.entity}
                  </option>
                ))}
              </Select>
              <Input
                aria-label="Pago extra"
                min="0"
                onChange={(event) => setExtraPayment(event.target.value)}
                step="0.01"
                type="number"
                value={extraPayment}
              />
              <Button type="button" variant="secondary" onClick={() => setExtraPayment("0")}>
                Limpiar
              </Button>
            </div>

            {simulation ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Nuevo balance</p>
                  <p className="mt-1 font-semibold">{formatCurrency(simulation.newBalance)}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Nueva cuota comprometida</p>
                  <p className="mt-1 font-semibold">{formatCurrency(simulation.newMonthlyCommitted)}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Nuevo endeudamiento</p>
                  <p className="mt-1 font-semibold">{formatPercent(simulation.newDebtBurdenPercent)}</p>
                </div>
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Salida estimada</p>
                  <p className="mt-1 font-semibold">{simulation.estimatedPayoffMonthLabel}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Registra una deuda activa para simular pagos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {health.impacts.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border bg-card table-scroll responsive-records">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">Deuda</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
                <th className="px-4 py-3 font-medium">Cuota</th>
                <th className="px-4 py-3 font-medium">Salida estimada</th>
                <th className="px-4 py-3 font-medium">Si se paga completa</th>
                <th className="px-4 py-3 font-medium">Nuevo %</th>
              </tr>
            </thead>
            <tbody>
              {health.impacts.map((impact) => (
                <tr key={impact.debtId} className="border-b last:border-0">
                  <td className="px-4 py-3" data-label="Deuda">
                    <div className="font-medium">{impact.name}</div>
                    <div className="text-xs text-muted-foreground">{impact.entity}</div>
                  </td>
                  <td className="px-4 py-3" data-label="Saldo">{formatCurrency(impact.pendingBalance)}</td>
                  <td className="px-4 py-3" data-label="Cuota">{formatCurrency(impact.monthlyPayment)}</td>
                  <td className="px-4 py-3" data-label="Salida estimada">{impact.payoffMonthLabel}</td>
                  <td className="px-4 py-3" data-label="Si se paga completa">
                    Baja {formatPercent(impact.percentReduction)}
                  </td>
                  <td className="px-4 py-3" data-label="Nuevo %">{formatPercent(impact.newDebtBurdenPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
