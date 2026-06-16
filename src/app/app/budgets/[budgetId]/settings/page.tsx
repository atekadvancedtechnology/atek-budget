import { notFound } from "next/navigation";

import { BudgetDeleteButton } from "@/components/budget-delete-button";
import { ExpenseCategoryManager } from "@/components/expense-category-manager";
import { InviteMemberForm } from "@/components/forms";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireBudgetAccess } from "@/lib/authorization";
import { getBudgetWorkspaceData } from "@/lib/data";
import { formatCurrency, formatPercent } from "@/lib/format";

type PageProps = {
  params: Promise<{ budgetId: string }>;
};

export default async function SettingsPage({ params }: PageProps) {
  const { budgetId } = await params;
  const access = await requireBudgetAccess(budgetId);
  const budget = await getBudgetWorkspaceData(budgetId);
  if (!budget) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Configuración</p>
        <h2 className="text-2xl font-semibold tracking-normal">{budget.name}</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
            <CardDescription>Configuración general y metas de ahorro.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Setting label="Moneda" value={budget.currency} />
            <Setting label="Día de inicio" value={String(budget.startDayOfMonth)} />
            <Setting label="Meta ahorro mensual" value={formatCurrency(budget.monthlySavingTarget)} />
            <Setting label="Meta ahorro %" value={formatPercent(Number(budget.savingTargetPercent))} />
            <Setting label="Meta fondo emergencia" value={formatCurrency(budget.emergencyFundTarget)} />
            <Setting label="Fondo actual" value={formatCurrency(budget.emergencyFundCurrent)} />
          </CardContent>
        </Card>

        <InviteMemberForm budgetId={budgetId} disabled={!access.canManage} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ExpenseCategoryManager
          budgetId={budgetId}
          canEdit={access.canEdit}
          categories={budget.categories.map((category) => ({
            id: category.id,
            name: category.name,
            icon: category.icon ?? "",
            recommendedMaxPercent: Number(category.recommendedMaxPercent),
            expensesCount: category._count.expenses
          }))}
        />

        <Card>
          <CardHeader>
            <CardTitle>Cuentas</CardTitle>
            <CardDescription>Bancos, tarjetas y fuentes disponibles.</CardDescription>
          </CardHeader>
          <CardContent className="responsive-records">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium" data-label="Nombre">{account.name}</TableCell>
                    <TableCell data-label="Institución">{account.institution}</TableCell>
                    <TableCell data-label="Tipo">{account.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Miembros</CardTitle>
            <CardDescription>Roles del workspace familiar.</CardDescription>
          </CardHeader>
          <CardContent className="responsive-records">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.workspace.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium" data-label="Usuario">{member.user.name}</TableCell>
                    <TableCell data-label="Email">{member.user.email}</TableCell>
                    <TableCell data-label="Rol">{member.role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invitaciones</CardTitle>
            <CardDescription>Últimas invitaciones emitidas.</CardDescription>
          </CardHeader>
          <CardContent className="responsive-records">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budget.workspace.invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium" data-label="Email">{invitation.email}</TableCell>
                    <TableCell data-label="Rol">{invitation.role}</TableCell>
                    <TableCell data-label="Estado">
                      <StatusBadge status={invitation.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {access.canManage ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Eliminar presupuesto</CardTitle>
            <CardDescription>
              Borra este presupuesto y todos sus periodos, ingresos, gastos, deudas, metas, categorias y cuentas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetDeleteButton budgetId={budgetId} budgetName={budget.name} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
