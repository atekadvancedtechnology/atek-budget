"use client";

import { Pencil, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createCurrencyAction, updateCurrencyAction } from "@/lib/actions";

type CurrencyItem = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  defaultRateToDop: number;
  isBase: boolean;
  isActive: boolean;
};

type CurrencyFormState = {
  code: string;
  name: string;
  symbol: string;
  defaultRateToDop: number;
  isBase: boolean;
  isActive: boolean;
};

const emptyForm: CurrencyFormState = {
  code: "",
  name: "",
  symbol: "",
  defaultRateToDop: 1,
  isBase: false,
  isActive: true
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar la moneda.";
}

export function CurrencyManager({
  budgetId,
  canEdit,
  currencies
}: {
  budgetId: string;
  canEdit: boolean;
  currencies: CurrencyItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<CurrencyFormState>(emptyForm);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const isEditing = Boolean(editingId);

  function resetForm() {
    setEditingId(undefined);
    setForm(emptyForm);
  }

  function submitCurrency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          code: form.code.toUpperCase(),
          defaultRateToDop: form.isBase ? 1 : form.defaultRateToDop,
          isActive: form.isBase ? true : form.isActive
        };

        if (editingId) {
          await updateCurrencyAction(budgetId, editingId, payload);
          setSuccess("Moneda actualizada.");
        } else {
          await createCurrencyAction(budgetId, payload);
          setSuccess("Moneda creada.");
        }
        resetForm();
        router.refresh();
      } catch (actionError) {
        setError(getErrorMessage(actionError));
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monedas</CardTitle>
        <CardDescription>Moneda base, simbolos y tasas por defecto hacia DOP.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 lg:grid-cols-[120px_1fr_120px_160px_auto]" onSubmit={submitCurrency}>
          <div className="space-y-2">
            <Label htmlFor="currencyCode">Codigo</Label>
            <Input
              disabled={!canEdit || isPending}
              id="currencyCode"
              maxLength={10}
              placeholder="USD"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyName">Nombre</Label>
            <Input
              disabled={!canEdit || isPending}
              id="currencyName"
              placeholder="Dolar estadounidense"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencySymbol">Simbolo</Label>
            <Input
              disabled={!canEdit || isPending}
              id="currencySymbol"
              placeholder="US$"
              value={form.symbol}
              onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currencyRate">Tasa DOP</Label>
            <Input
              disabled={!canEdit || isPending || form.isBase}
              id="currencyRate"
              inputMode="decimal"
              min="0.0001"
              step="0.0001"
              type="number"
              value={form.isBase ? 1 : form.defaultRateToDop}
              onChange={(event) =>
                setForm((current) => ({ ...current, defaultRateToDop: Number(event.target.value) || 1 }))
              }
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                checked={form.isBase}
                className="h-4 w-4 rounded border-input"
                disabled={!canEdit || isPending}
                type="checkbox"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isBase: event.target.checked,
                    isActive: event.target.checked ? true : current.isActive,
                    defaultRateToDop: event.target.checked ? 1 : current.defaultRateToDop
                  }))
                }
              />
              Base
            </label>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                checked={form.isActive}
                className="h-4 w-4 rounded border-input"
                disabled={!canEdit || isPending || form.isBase}
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              Activa
            </label>
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
                <TableHead>Codigo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Simbolo</TableHead>
                <TableHead>Tasa DOP</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.id}>
                  <TableCell className="font-medium" data-label="Codigo">{currency.code}</TableCell>
                  <TableCell data-label="Nombre">{currency.name}</TableCell>
                  <TableCell data-label="Simbolo">{currency.symbol}</TableCell>
                  <TableCell data-label="Tasa DOP">{currency.defaultRateToDop.toLocaleString("en-US", { maximumFractionDigits: 4 })}</TableCell>
                  <TableCell data-label="Estado">
                    <div className="flex flex-wrap gap-2">
                      {currency.isBase ? <Badge tone="info">Base</Badge> : null}
                      <Badge tone={currency.isActive ? "success" : "neutral"}>
                        {currency.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" data-label="">
                    {canEdit ? (
                      <Button
                        aria-label={`Editar moneda ${currency.code}`}
                        className="h-8 w-8"
                        disabled={isPending}
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setError(undefined);
                          setSuccess(undefined);
                          setEditingId(currency.id);
                          setForm({
                            code: currency.code,
                            name: currency.name,
                            symbol: currency.symbol,
                            defaultRateToDop: currency.defaultRateToDop,
                            isBase: currency.isBase,
                            isActive: currency.isActive
                          });
                        }}
                      >
                        <Pencil aria-hidden="true" className="h-4 w-4" />
                      </Button>
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
