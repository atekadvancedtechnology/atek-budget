"use client";

import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createBankAccountAction,
  deleteBankAccountAction,
  updateBankAccountAction
} from "@/lib/actions";

type BankAccountItem = {
  id: string;
  name: string;
  institution: string;
  type: string;
  notes: string;
  usageCount: number;
};

type AccountFormState = {
  name: string;
  institution: string;
  type: string;
  notes: string;
};

const emptyForm: AccountFormState = {
  name: "",
  institution: "",
  type: "",
  notes: ""
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar la cuenta.";
}

export function BankAccountManager({
  budgetId,
  canEdit,
  accounts
}: {
  budgetId: string;
  canEdit: boolean;
  accounts: BankAccountItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<AccountFormState>(emptyForm);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const isEditing = Boolean(editingId);

  function resetForm() {
    setEditingId(undefined);
    setForm(emptyForm);
  }

  function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateBankAccountAction(budgetId, editingId, form);
          setSuccess("Cuenta actualizada.");
        } else {
          await createBankAccountAction(budgetId, form);
          setSuccess("Cuenta creada.");
        }
        resetForm();
        router.refresh();
      } catch (actionError) {
        setError(getErrorMessage(actionError));
      }
    });
  }

  function deleteAccount(account: BankAccountItem) {
    const confirmed = window.confirm(
      `Eliminar la cuenta "${account.name}"? Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        await deleteBankAccountAction(budgetId, account.id);
        setSuccess("Cuenta eliminada.");
        if (editingId === account.id) resetForm();
        router.refresh();
      } catch (actionError) {
        setError(getErrorMessage(actionError));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas</CardTitle>
        <CardDescription>Bancos, tarjetas, efectivo y fuentes usadas en gastos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={submitAccount}>
          <div className="space-y-2">
            <Label htmlFor="accountName">Nombre</Label>
            <Input
              disabled={!canEdit || isPending}
              id="accountName"
              placeholder="Efectivo"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountInstitution">Institucion</Label>
            <Input
              disabled={!canEdit || isPending}
              id="accountInstitution"
              placeholder="Banco o entidad"
              value={form.institution}
              onChange={(event) =>
                setForm((current) => ({ ...current, institution: event.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountType">Tipo</Label>
            <Input
              disabled={!canEdit || isPending}
              id="accountType"
              placeholder="Banco, tarjeta, efectivo"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNotes">Notas</Label>
            <Input
              disabled={!canEdit || isPending}
              id="accountNotes"
              placeholder="Opcional"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button disabled={!canEdit || isPending} type="submit">
              {isEditing ? <Save aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
              {isEditing ? "Guardar" : "Crear"}
            </Button>
            {isEditing ? (
              <Button disabled={isPending} type="button" variant="outline" onClick={resetForm}>
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        </form>

        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <div className="responsive-records overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Institucion</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium" data-label="Nombre">{account.name}</TableCell>
                  <TableCell data-label="Institucion">{account.institution}</TableCell>
                  <TableCell data-label="Tipo">{account.type}</TableCell>
                  <TableCell data-label="Usos">{account.usageCount}</TableCell>
                  <TableCell data-label="Notas">{account.notes || "-"}</TableCell>
                  <TableCell className="text-right" data-label="">
                    {canEdit ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          aria-label={`Editar cuenta ${account.name}`}
                          className="h-8 w-8"
                          disabled={isPending}
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setError(undefined);
                            setSuccess(undefined);
                            setEditingId(account.id);
                            setForm({
                              name: account.name,
                              institution: account.institution,
                              type: account.type,
                              notes: account.notes
                            });
                          }}
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          aria-label={`Eliminar cuenta ${account.name}`}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isPending}
                          size="icon"
                          title={
                            account.usageCount > 0
                              ? "No se puede eliminar porque tiene gastos o pagos"
                              : "Eliminar cuenta"
                          }
                          type="button"
                          variant="ghost"
                          onClick={() => deleteAccount(account)}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
