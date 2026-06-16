import { ArrowRight, CalendarClock, UsersRound } from "lucide-react";
import Link from "next/link";

import { CreateBudgetForm } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/authorization";
import { getUserBudgets } from "@/lib/data";
import { periodLabel } from "@/lib/format";

export default async function AppHomePage() {
  const user = await requireUser();
  const budgets = await getUserBudgets(user.id);

  return (
    <main className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Presupuestos</h1>
        <p className="mt-2 text-muted-foreground">Workspaces y presupuestos donde tienes membresía activa.</p>
      </div>

      {budgets.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {budgets.map((budget) => {
            const activePeriod = budget.periods.find((period) => period.status === "ACTIVE") ?? budget.periods[0];
            const role = budget.workspace.members.find((member) => member.userId === user.id)?.role;
            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{budget.name}</CardTitle>
                      <CardDescription>{budget.workspace.name}</CardDescription>
                    </div>
                    <Badge tone={role === "OWNER" ? "success" : role === "EDITOR" ? "info" : "neutral"}>{role}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock aria-hidden="true" className="h-4 w-4" />
                        Periodo activo
                      </div>
                      <p className="mt-2 font-medium">
                        {activePeriod ? periodLabel(activePeriod.year, activePeriod.month) : "Sin periodos"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UsersRound aria-hidden="true" className="h-4 w-4" />
                        Miembros
                      </div>
                      <p className="mt-2 font-medium">{budget.workspace.members.length}</p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/app/budgets/${budget.id}/dashboard`}>
                      Abrir dashboard
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aún no tienes presupuestos">
          Crea tu primer workspace familiar o ejecuta `npm run prisma:seed` para cargar el presupuesto de prueba.
        </EmptyState>
      )}

      <CreateBudgetForm />
    </main>
  );
}
