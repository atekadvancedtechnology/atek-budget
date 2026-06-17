"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ConfirmButton } from "@/components/confirm-button";
import { deleteBudgetAction } from "@/lib/actions";

export function BudgetDeleteButton({
  budgetId,
  budgetName,
  className,
  compact = false,
  disabled = false
}: {
  budgetId: string;
  budgetName: string;
  className?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteBudgetAction(budgetId);
        router.push("/app");
        router.refresh();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "No se pudo eliminar el presupuesto.");
      }
    });
  }

  return (
    <ConfirmButton
      className={className}
      confirmDescription={`Eliminar el presupuesto "${budgetName}" borrara todos sus periodos, ingresos, recibos, gastos, deudas, metas, categorias y cuentas. Esta accion no se puede deshacer.`}
      confirmLabel="Eliminar presupuesto"
      confirmTitle="Eliminar presupuesto"
      disabled={disabled || isPending}
      onConfirm={handleDelete}
      size={compact ? "sm" : "default"}
      variant="destructive"
    >
      <Trash2 aria-hidden="true" className="h-4 w-4" />
      {isPending ? "Eliminando..." : compact ? "Eliminar" : "Eliminar presupuesto"}
    </ConfirmButton>
  );
}
