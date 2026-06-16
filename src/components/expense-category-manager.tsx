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
  createExpenseCategoryAction,
  deleteExpenseCategoryAction,
  updateExpenseCategoryAction
} from "@/lib/actions";
import { formatPercent } from "@/lib/format";

type ExpenseCategoryItem = {
  id: string;
  name: string;
  icon: string;
  recommendedMaxPercent: number;
  expensesCount: number;
};

type CategoryFormState = {
  name: string;
  icon: string;
  recommendedMaxPercent: number;
};

const emptyForm: CategoryFormState = {
  name: "",
  icon: "",
  recommendedMaxPercent: 0
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar la categoria.";
}

export function ExpenseCategoryManager({
  budgetId,
  canEdit,
  categories
}: {
  budgetId: string;
  canEdit: boolean;
  categories: ExpenseCategoryItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const isEditing = Boolean(editingId);

  function resetForm() {
    setEditingId(undefined);
    setForm(emptyForm);
  }

  function submitCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateExpenseCategoryAction(budgetId, editingId, form);
          setSuccess("Categoria actualizada.");
        } else {
          await createExpenseCategoryAction(budgetId, form);
          setSuccess("Categoria creada.");
        }
        resetForm();
        router.refresh();
      } catch (actionError) {
        setError(getErrorMessage(actionError));
      }
    });
  }

  function deleteCategory(category: ExpenseCategoryItem) {
    const confirmed = window.confirm(
      `Eliminar la categoria "${category.name}"? Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        await deleteExpenseCategoryAction(budgetId, category.id);
        setSuccess("Categoria eliminada.");
        if (editingId === category.id) resetForm();
        router.refresh();
      } catch (actionError) {
        setError(getErrorMessage(actionError));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Categorias</CardTitle>
        <CardDescription>Clasificacion y meta maxima recomendada por categoria.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_140px_auto]" onSubmit={submitCategory}>
          <div className="space-y-2">
            <Label htmlFor="categoryName">Nombre</Label>
            <Input
              disabled={!canEdit || isPending}
              id="categoryName"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryIcon">Icono</Label>
            <Input
              disabled={!canEdit || isPending}
              id="categoryIcon"
              value={form.icon}
              onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryPercent">Meta %</Label>
            <Input
              disabled={!canEdit || isPending}
              id="categoryPercent"
              inputMode="decimal"
              max="100"
              min="0"
              step="0.01"
              type="number"
              value={form.recommendedMaxPercent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  recommendedMaxPercent: Number(event.target.value) || 0
                }))
              }
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
                <TableHead>Icono</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>Gastos</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium" data-label="Nombre">{category.name}</TableCell>
                  <TableCell data-label="Icono">{category.icon || "-"}</TableCell>
                  <TableCell data-label="Meta">{formatPercent(category.recommendedMaxPercent)}</TableCell>
                  <TableCell data-label="Gastos">{category.expensesCount}</TableCell>
                  <TableCell className="text-right" data-label="">
                    {canEdit ? (
                      <div className="flex justify-end gap-1">
                        <Button
                          aria-label={`Editar categoria ${category.name}`}
                          className="h-8 w-8"
                          disabled={isPending}
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setError(undefined);
                            setSuccess(undefined);
                            setEditingId(category.id);
                            setForm({
                              name: category.name,
                              icon: category.icon,
                              recommendedMaxPercent: category.recommendedMaxPercent
                            });
                          }}
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          aria-label={`Eliminar categoria ${category.name}`}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={isPending}
                          size="icon"
                          title={
                            category.expensesCount > 0
                              ? "No se puede eliminar porque tiene gastos"
                              : "Eliminar categoria"
                          }
                          type="button"
                          variant="ghost"
                          onClick={() => deleteCategory(category)}
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
