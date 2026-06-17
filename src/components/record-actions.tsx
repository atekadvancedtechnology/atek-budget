"use client";

import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  deleteDebtAction,
  deleteExpenseAction,
  deleteExpensePaymentAction,
  deleteIncomeAction,
  deleteIncomeReceiptAction,
  deleteSavingGoalAction,
  markDebtPaidAction
} from "@/lib/actions";
import { Button } from "@/components/ui/button";

type RecordEntity = "income" | "incomeReceipt" | "expense" | "expensePayment" | "debt" | "savingGoal";

const deleteActions = {
  income: deleteIncomeAction,
  incomeReceipt: deleteIncomeReceiptAction,
  expense: deleteExpenseAction,
  expensePayment: deleteExpensePaymentAction,
  debt: deleteDebtAction,
  savingGoal: deleteSavingGoalAction
};

const entityLabels: Record<RecordEntity, string> = {
  income: "ingreso esperado",
  incomeReceipt: "ingreso recibido",
  expense: "gasto",
  expensePayment: "pago de gasto",
  debt: "deuda",
  savingGoal: "meta de ahorro"
};

export function RecordActions({
  budgetId,
  canMarkPaid,
  editHref,
  entity,
  isPaidDisabled,
  recordId
}: {
  budgetId: string;
  canMarkPaid?: boolean;
  editHref: string;
  entity: RecordEntity;
  isPaidDisabled?: boolean;
  recordId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const label = entityLabels[entity];

  function runAction(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "No se pudo completar la acción.");
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild className="h-8 w-8" size="icon" title={`Editar ${label}`} variant="ghost">
        <Link aria-label={`Editar ${label}`} href={editHref}>
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Button>
      {canMarkPaid ? (
        <Button
          aria-label="Marcar deuda como pagada"
          className="h-8 w-8"
          disabled={isPending || isPaidDisabled}
          size="icon"
          title="Marcar como pagada"
          type="button"
          variant="ghost"
          onClick={() => runAction(() => markDebtPaidAction(budgetId, recordId))}
        >
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      ) : null}
      <Button
        aria-label={`Eliminar ${label}`}
        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={isPending}
        size="icon"
        title={`Eliminar ${label}`}
        type="button"
        variant="ghost"
        onClick={() => {
          if (!window.confirm(`¿Eliminar este ${label}? Esta acción no se puede deshacer.`)) return;
          runAction(() => deleteActions[entity](budgetId, recordId));
        }}
      >
        <Trash2 aria-hidden="true" className="h-4 w-4" />
      </Button>
    </div>
  );
}
