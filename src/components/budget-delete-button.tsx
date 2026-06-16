"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
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
    const confirmed = window.confirm(
      `Eliminar el presupuesto "${budgetName}" borrara todos sus periodos, ingresos, recibos, gastos, deudas, metas, categorias y cuentas. Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;

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
    <Button
      className={className}
      disabled={disabled || isPending}
      size={compact ? "sm" : "default"}
      type="button"
      variant="destructive"
      onClick={handleDelete}
    >
      <Trash2 aria-hidden="true" className="h-4 w-4" />
      {isPending ? "Eliminando..." : compact ? "Eliminar" : "Eliminar presupuesto"}
    </Button>
  );
}
