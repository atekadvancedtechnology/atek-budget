"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Send, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import {
  useForm,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn
} from "react-hook-form";
import type { z } from "zod";

import {
  createBudgetAction,
  createDebtAction,
  createExpenseAction,
  createIncomeAction,
  createIncomeReceiptAction,
  createSavingGoalAction,
  inviteMemberAction,
  updateDebtAction,
  updateExpenseAction,
  updateIncomeAction,
  updateIncomeReceiptAction,
  updateSavingGoalAction
} from "@/lib/actions";
import {
  createBudgetSchema,
  debtSchema,
  expenseSchema,
  incomeReceiptSchema,
  incomeSchema,
  invitationSchema,
  savingGoalSchema
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo guardar el registro.";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-rose-600">{message}</p>;
}

function FormStatus({ error, success }: { error?: string; success?: string }) {
  if (error) return <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  if (success) return <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>;
  return null;
}

function stripNumberFormatting(value: string) {
  return value.replace(/,/g, "").replace(/[^\d.]/g, "");
}

function parseFormattedNumber(value: string) {
  const normalized = stripNumberFormatting(value);
  if (!normalized) return 0;
  return Number(normalized) || 0;
}

function formatNumericInput(value: string, allowDecimals: boolean) {
  const normalized = stripNumberFormatting(value);
  const [rawInteger = "", ...rawDecimalParts] = normalized.split(".");
  const integerDigits = rawInteger.replace(/^0+(?=\d)/, "");
  const integer = integerDigits ? Number(integerDigits).toLocaleString("en-US") : "";

  if (!allowDecimals) {
    return integer;
  }

  const decimal = rawDecimalParts.join("");
  if (normalized.includes(".")) {
    return `${integer || "0"}.${decimal}`;
  }

  return integer;
}

function formatStoredNumber(value: unknown, allowDecimals: boolean) {
  if (value === null || value === undefined || value === "") return "";
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "";
  return numberValue.toLocaleString("en-US", {
    maximumFractionDigits: allowDecimals ? 6 : 0,
    minimumFractionDigits: 0
  });
}

const amountTypeOptions = [
  { id: "FIXED", name: "Fijo" },
  { id: "VARIABLE", name: "Variable" },
  { id: "ESTIMATED", name: "Estimado" }
];

const frequencyOptions = [
  { id: "ONE_TIME", name: "Único" },
  { id: "DAILY", name: "Diario" },
  { id: "WEEKLY", name: "Semanal" },
  { id: "BIWEEKLY", name: "Quincenal" },
  { id: "MONTHLY", name: "Mensual" },
  { id: "BIMONTHLY", name: "Bimestral" },
  { id: "QUARTERLY", name: "Trimestral" },
  { id: "SEMIANNUAL", name: "Semestral" },
  { id: "ANNUAL", name: "Anual" },
  { id: "IRREGULAR", name: "Irregular" },
  { id: "CUSTOM", name: "Personalizado" }
];

type IncomeFormValues = z.infer<typeof incomeSchema>;
type IncomeReceiptFormValues = z.infer<typeof incomeReceiptSchema>;
type ExpenseFormValues = z.infer<typeof expenseSchema>;
type DebtFormValues = z.infer<typeof debtSchema>;
type SavingGoalFormValues = z.infer<typeof savingGoalSchema>;

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function periodStartInputValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function defaultDateForPeriod(year: number, month: number) {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() + 1 === month) {
    return todayInputValue();
  }

  return periodStartInputValue(year, month);
}

export function CreateBudgetForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const form = useForm<z.infer<typeof createBudgetSchema>>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      workspaceName: "Mi hogar",
      budgetName: "Presupuesto familiar"
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear presupuesto</CardTitle>
        <CardDescription>Inicia un workspace familiar con categorías, cuentas y periodo activo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
          onSubmit={form.handleSubmit((values) => {
            setError(undefined);
            startTransition(async () => {
              try {
                await createBudgetAction(values);
              } catch (actionError) {
                setError(getErrorMessage(actionError));
              }
            });
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Hogar</Label>
            <Input id="workspaceName" {...form.register("workspaceName")} />
            <FieldError message={form.formState.errors.workspaceName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetName">Presupuesto</Label>
            <Input id="budgetName" {...form.register("budgetName")} />
            <FieldError message={form.formState.errors.budgetName?.message} />
          </div>
          <div className="flex items-end">
            <Button disabled={isPending} type="submit">
              <WalletCards aria-hidden="true" className="h-4 w-4" />
              Crear
            </Button>
          </div>
          <div className="md:col-span-3">
            <FormStatus error={error} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function IncomeForm({
  budgetId,
  disabled,
  initialValues,
  periodMonth,
  periodYear,
  recordId,
  returnPath
}: {
  budgetId: string;
  disabled: boolean;
  initialValues?: IncomeFormValues;
  periodMonth: number;
  periodYear: number;
  recordId?: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [formVersion, setFormVersion] = useState(0);
  const isEditing = Boolean(recordId);
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: initialValues ?? {
      responsibleName: "",
      source: "",
      amount: 0,
      amountType: "FIXED",
      frequency: "MONTHLY",
      startDate: periodStartInputValue(periodYear, periodMonth),
      endDate: "",
      customRule: "",
      expectedPaymentDays: "",
      isActive: true,
      notes: ""
    }
  });

  return (
    <RecordFormShell
      title={isEditing ? "Editar ingreso esperado" : "Nuevo ingreso esperado"}
      description="Define monto, frecuencia y reglas de pago del periodo seleccionado."
      disabled={disabled}
    >
      <form
        key={formVersion}
        className="grid gap-4 md:grid-cols-4"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              if (isEditing && recordId) {
                await updateIncomeAction(budgetId, recordId, values);
                setSuccess("Ingreso actualizado.");
                if (returnPath) router.push(returnPath);
              } else {
                await createIncomeAction(budgetId, { year: periodYear, month: periodMonth }, values);
                form.reset();
                setFormVersion((version) => version + 1);
                setSuccess("Ingreso guardado.");
              }
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <TextInput label="Responsable" name="responsibleName" form={form} disabled={disabled} />
        <TextInput label="Fuente" name="source" form={form} disabled={disabled} />
        <MoneyInput label="Monto" name="amount" form={form} disabled={disabled} />
        <SelectField label="Tipo de monto" name="amountType" form={form} disabled={disabled} options={amountTypeOptions} />
        <SelectField label="Frecuencia" name="frequency" form={form} disabled={disabled} options={frequencyOptions} />
        <TextInput label="Fecha de inicio" name="startDate" form={form} disabled={disabled} type="date" />
        <TextInput label="Fecha final" name="endDate" form={form} disabled={disabled} type="date" />
        <TextInput label="Días esperados" name="expectedPaymentDays" form={form} disabled={disabled} />
        <TextInput label="Regla personalizada" name="customRule" form={form} disabled={disabled} />
        <div className="flex items-center gap-2 pt-7">
          <input
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="incomeIsActive"
            type="checkbox"
            {...form.register("isActive")}
          />
          <Label htmlFor="incomeIsActive">Activo</Label>
        </div>
        <TextInput label="Notas" name="notes" form={form} disabled={disabled} />
        <FormFooter
          cancelHref={isEditing ? returnPath : undefined}
          isPending={isPending}
          disabled={disabled}
          error={error}
          success={success}
          className="md:col-span-4"
        />
      </form>
    </RecordFormShell>
  );
}

export function IncomeReceiptForm({
  budgetId,
  disabled,
  incomes,
  initialValues,
  periodMonth,
  periodYear,
  recordId,
  returnPath
}: {
  budgetId: string;
  disabled: boolean;
  incomes: { id: string; responsibleName: string; source: string }[];
  initialValues?: IncomeReceiptFormValues;
  periodMonth: number;
  periodYear: number;
  recordId?: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [formVersion, setFormVersion] = useState(0);
  const isEditing = Boolean(recordId);
  const [selectedIncomeId, setSelectedIncomeId] = useState(initialValues?.incomeId ?? "");
  const form = useForm<IncomeReceiptFormValues>({
    resolver: zodResolver(incomeReceiptSchema),
    defaultValues: initialValues ?? {
      incomeId: "",
      responsibleName: "",
      source: "",
      amount: 0,
      receivedDate: defaultDateForPeriod(periodYear, periodMonth),
      notes: ""
    }
  });

  return (
    <RecordFormShell title={isEditing ? "Editar ingreso recibido" : "Ingreso recibido"} description="Registra pagos reales, bonos, comisiones o ingresos únicos." disabled={disabled}>
      <form
        key={formVersion}
        className="grid gap-4 md:grid-cols-4"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              if (isEditing && recordId) {
                await updateIncomeReceiptAction(budgetId, recordId, values);
                setSuccess("Ingreso recibido actualizado.");
                if (returnPath) router.push(returnPath);
              } else {
                await createIncomeReceiptAction(budgetId, { year: periodYear, month: periodMonth }, values);
                form.reset();
                setSelectedIncomeId("");
                setFormVersion((version) => version + 1);
                setSuccess("Ingreso recibido guardado.");
              }
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="incomeId">Ingreso planificado</Label>
          <Select
            disabled={disabled}
            id="incomeId"
            value={selectedIncomeId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedIncomeId(value);
              form.setValue("incomeId", value, { shouldDirty: true, shouldValidate: true });
              const selectedIncome = incomes.find((income) => income.id === value);
              if (selectedIncome) {
                form.setValue("responsibleName", selectedIncome.responsibleName, {
                  shouldDirty: true,
                  shouldValidate: true
                });
                form.setValue("source", selectedIncome.source, { shouldDirty: true, shouldValidate: true });
              }
            }}
          >
            <option value="">No asociado / irregular</option>
            {incomes.map((income) => (
              <option key={income.id} value={income.id}>
                {income.responsibleName} - {income.source}
              </option>
            ))}
          </Select>
          <FieldError message={form.formState.errors.incomeId?.message?.toString()} />
        </div>
        <TextInput label="Responsable" name="responsibleName" form={form} disabled={disabled} />
        <TextInput label="Fuente" name="source" form={form} disabled={disabled} />
        <MoneyInput label="Monto recibido" name="amount" form={form} disabled={disabled} />
        <TextInput label="Fecha recibida" name="receivedDate" form={form} disabled={disabled} type="date" />
        <TextInput label="Notas" name="notes" form={form} disabled={disabled} />
        <FormFooter
          cancelHref={isEditing ? returnPath : undefined}
          isPending={isPending}
          disabled={disabled}
          error={error}
          success={success}
          className="md:col-span-4"
        />
      </form>
    </RecordFormShell>
  );
}

export function ExpenseForm({
  budgetId,
  disabled,
  categories,
  accounts,
  initialValues,
  periodMonth,
  periodYear,
  recordId,
  returnPath
}: {
  budgetId: string;
  disabled: boolean;
  categories: { id: string; name: string }[];
  accounts: { id: string; name: string }[];
  initialValues?: ExpenseFormValues;
  periodMonth: number;
  periodYear: number;
  recordId?: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [formVersion, setFormVersion] = useState(0);
  const isEditing = Boolean(recordId);
  const accountOptions = [{ id: "", name: "Sin cuenta" }, ...accounts];
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialValues ?? {
      name: "",
      responsibleName: "",
      categoryId: categories[0]?.id ?? "",
      amountBudgetedMonthly: 0,
      amountQ1: 0,
      amountQ2: 0,
      bankAccountId: "",
      actualAmount: 0,
      expenseDate: defaultDateForPeriod(periodYear, periodMonth),
      isRecurring: true,
      notes: ""
    }
  });

  return (
    <RecordFormShell title={isEditing ? "Editar gasto" : "Nuevo gasto"} description="Presupuesto y monto real se validan desde servidor." disabled={disabled}>
      <form
        key={formVersion}
        className="grid gap-4 md:grid-cols-4"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              if (isEditing && recordId) {
                await updateExpenseAction(budgetId, recordId, values);
                setSuccess("Gasto actualizado.");
                if (returnPath) router.push(returnPath);
              } else {
                await createExpenseAction(budgetId, { year: periodYear, month: periodMonth }, values);
                form.reset();
                setFormVersion((version) => version + 1);
                setSuccess("Gasto guardado.");
              }
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <TextInput label="Gasto" name="name" form={form} disabled={disabled} />
        <TextInput label="Responsable" name="responsibleName" form={form} disabled={disabled} />
        <SelectField label="Categoría" name="categoryId" form={form} disabled={disabled} options={categories} />
        <SelectField label="Cuenta" name="bankAccountId" form={form} disabled={disabled} options={accountOptions} />
        <MoneyInput label="Presupuesto" name="amountBudgetedMonthly" form={form} disabled={disabled} />
        <MoneyInput label="Quincena 1" name="amountQ1" form={form} disabled={disabled} />
        <MoneyInput label="Quincena 2" name="amountQ2" form={form} disabled={disabled} />
        <MoneyInput label="Real" name="actualAmount" form={form} disabled={disabled} />
        <TextInput label="Fecha" name="expenseDate" form={form} disabled={disabled} type="date" />
        <div className="flex items-center gap-2 pt-7">
          <input
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
            id="isRecurring"
            type="checkbox"
            {...form.register("isRecurring")}
          />
          <Label htmlFor="isRecurring">Recurrente</Label>
        </div>
        <TextInput label="Notas" name="notes" form={form} disabled={disabled} />
        <FormFooter
          cancelHref={isEditing ? returnPath : undefined}
          isPending={isPending}
          disabled={disabled}
          error={error}
          success={success}
          className="md:col-span-4"
        />
      </form>
    </RecordFormShell>
  );
}

export function DebtForm({
  budgetId,
  disabled,
  initialValues,
  periodMonth,
  periodYear,
  recordId,
  returnPath
}: {
  budgetId: string;
  disabled: boolean;
  initialValues?: DebtFormValues;
  periodMonth: number;
  periodYear: number;
  recordId?: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [formVersion, setFormVersion] = useState(0);
  const isEditing = Boolean(recordId);
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: initialValues ?? {
      name: "",
      entity: "",
      responsibleName: "",
      pendingBalance: 0,
      monthlyPayment: 0,
      annualInterestRate: 0,
      remainingMonths: 0,
      strategy: "CUSTOM",
      notes: ""
    }
  });

  return (
    <RecordFormShell title={isEditing ? "Editar deuda" : "Nueva deuda"} description="Calcula interés estimado y porcentaje sobre ingreso." disabled={disabled}>
      <form
        key={formVersion}
        className="grid gap-4 md:grid-cols-4"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              if (isEditing && recordId) {
                await updateDebtAction(budgetId, recordId, values);
                setSuccess("Deuda actualizada.");
                if (returnPath) router.push(returnPath);
              } else {
                await createDebtAction(budgetId, { year: periodYear, month: periodMonth }, values);
                form.reset();
                setFormVersion((version) => version + 1);
                setSuccess("Deuda guardada.");
              }
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <TextInput label="Deuda" name="name" form={form} disabled={disabled} />
        <TextInput label="Entidad" name="entity" form={form} disabled={disabled} />
        <TextInput label="Responsable" name="responsibleName" form={form} disabled={disabled} />
        <SelectField
          label="Estrategia"
          name="strategy"
          form={form}
          disabled={disabled}
          options={[
            { id: "AVALANCHE", name: "Avalancha" },
            { id: "SNOWBALL", name: "Bola de nieve" },
            { id: "CUSTOM", name: "Personalizada" }
          ]}
        />
        <MoneyInput label="Saldo" name="pendingBalance" form={form} disabled={disabled} />
        <MoneyInput label="Cuota mensual" name="monthlyPayment" form={form} disabled={disabled} />
        <MoneyInput label="Interés anual %" name="annualInterestRate" form={form} disabled={disabled} />
        <MoneyInput label="Meses restantes" name="remainingMonths" form={form} disabled={disabled} step="1" />
        <TextInput label="Notas" name="notes" form={form} disabled={disabled} />
        <FormFooter
          cancelHref={isEditing ? returnPath : undefined}
          isPending={isPending}
          disabled={disabled}
          error={error}
          success={success}
          className="md:col-span-4"
        />
      </form>
    </RecordFormShell>
  );
}

export function SavingGoalForm({
  budgetId,
  disabled,
  initialValues,
  periodMonth,
  periodYear,
  recordId,
  returnPath
}: {
  budgetId: string;
  disabled: boolean;
  initialValues?: SavingGoalFormValues;
  periodMonth: number;
  periodYear: number;
  recordId?: string;
  returnPath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [formVersion, setFormVersion] = useState(0);
  const isEditing = Boolean(recordId);
  const form = useForm<SavingGoalFormValues>({
    resolver: zodResolver(savingGoalSchema),
    defaultValues: initialValues ?? {
      name: "",
      monthlyTarget: 0,
      contributedThisMonth: 0,
      accumulatedBalance: 0,
      institution: "",
      priority: 2,
      notes: ""
    }
  });

  return (
    <RecordFormShell title={isEditing ? "Editar meta" : "Nueva meta"} description="Registra meta, aporte del mes y saldo acumulado." disabled={disabled}>
      <form
        key={formVersion}
        className="grid gap-4 md:grid-cols-4"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              if (isEditing && recordId) {
                await updateSavingGoalAction(budgetId, recordId, values);
                setSuccess("Meta actualizada.");
                if (returnPath) router.push(returnPath);
              } else {
                await createSavingGoalAction(budgetId, { year: periodYear, month: periodMonth }, values);
                form.reset();
                setFormVersion((version) => version + 1);
                setSuccess("Meta guardada.");
              }
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <TextInput label="Destino" name="name" form={form} disabled={disabled} />
        <TextInput label="Institución" name="institution" form={form} disabled={disabled} />
        <MoneyInput label="Meta mensual" name="monthlyTarget" form={form} disabled={disabled} />
        <MoneyInput label="Aportado" name="contributedThisMonth" form={form} disabled={disabled} />
        <MoneyInput label="Acumulado" name="accumulatedBalance" form={form} disabled={disabled} />
        <MoneyInput label="Prioridad" name="priority" form={form} disabled={disabled} step="1" />
        <TextInput label="Notas" name="notes" form={form} disabled={disabled} />
        <FormFooter
          cancelHref={isEditing ? returnPath : undefined}
          isPending={isPending}
          disabled={disabled}
          error={error}
          success={success}
          className="md:col-span-4"
        />
      </form>
    </RecordFormShell>
  );
}

export function InviteMemberForm({ budgetId, disabled }: { budgetId: string; disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const form = useForm<z.infer<typeof invitationSchema>>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: "EDITOR"
    }
  });

  return (
    <RecordFormShell title="Invitar miembro" description="Solo Owner puede invitar miembros al workspace." disabled={disabled}>
      <form
        className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
        onSubmit={form.handleSubmit((values) => {
          setError(undefined);
          setSuccess(undefined);
          startTransition(async () => {
            try {
              await inviteMemberAction(budgetId, values);
              form.reset();
              setSuccess("Invitación creada.");
            } catch (actionError) {
              setError(getErrorMessage(actionError));
            }
          });
        })}
      >
        <TextInput label="Email" name="email" form={form} disabled={disabled} type="email" />
        <SelectField
          label="Rol"
          name="role"
          form={form}
          disabled={disabled}
          options={[
            { id: "EDITOR", name: "Editor" },
            { id: "VIEWER", name: "Viewer" }
          ]}
        />
        <div className="flex items-end">
          <Button disabled={disabled || isPending} type="submit">
            <Send aria-hidden="true" className="h-4 w-4" />
            Invitar
          </Button>
        </div>
        <div className="md:col-span-3">
          <FormStatus error={error} success={success} />
        </div>
      </form>
    </RecordFormShell>
  );
}

function RecordFormShell({
  title,
  description,
  disabled,
  children
}: {
  title: string;
  description: string;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {disabled ? "Tu rol actual es Viewer, por eso esta acción está bloqueada." : description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FormFooter({
  cancelHref,
  isPending,
  disabled,
  error,
  success,
  className
}: {
  cancelHref?: string;
  isPending: boolean;
  disabled: boolean;
  error?: string;
  success?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex justify-end gap-2">
        {cancelHref ? (
          <Button asChild variant="outline">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
        ) : null}
        <Button disabled={disabled || isPending} type="submit">
          <Save aria-hidden="true" className="h-4 w-4" />
          Guardar
        </Button>
      </div>
      <div className="mt-3">
        <FormStatus error={error} success={success} />
      </div>
    </div>
  );
}

function TextInput<T extends FieldValues>({
  label,
  name,
  form,
  disabled,
  type = "text"
}: {
  label: string;
  name: Path<T>;
  form: UseFormReturn<T>;
  disabled: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input disabled={disabled} id={name} type={type} {...form.register(name)} />
      <FieldError message={form.formState.errors[name]?.message?.toString()} />
    </div>
  );
}

function MoneyInput<T extends FieldValues>({
  label,
  name,
  form,
  disabled,
  step = "0.01"
}: {
  label: string;
  name: Path<T>;
  form: UseFormReturn<T>;
  disabled: boolean;
  step?: string;
}) {
  const allowDecimals = step !== "1";
  const storedValue = form.watch(name);
  const [displayValue, setDisplayValue] = useState(() => formatStoredNumber(storedValue, allowDecimals));

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        autoComplete="off"
        disabled={disabled}
        id={name}
        inputMode={allowDecimals ? "decimal" : "numeric"}
        value={displayValue}
        onBlur={() => {
          setDisplayValue(formatStoredNumber(parseFormattedNumber(displayValue), allowDecimals));
        }}
        onChange={(event) => {
          const nextValue = formatNumericInput(event.target.value, allowDecimals);
          setDisplayValue(nextValue);
          form.setValue(name, parseFormattedNumber(nextValue) as PathValue<T, Path<T>>, {
            shouldDirty: true,
            shouldValidate: true
          });
        }}
      />
      <FieldError message={form.formState.errors[name]?.message?.toString()} />
    </div>
  );
}

function SelectField<T extends FieldValues>({
  label,
  name,
  form,
  disabled,
  options
}: {
  label: string;
  name: Path<T>;
  form: UseFormReturn<T>;
  disabled: boolean;
  options: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Select disabled={disabled} id={name} {...form.register(name)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </Select>
      <FieldError message={form.formState.errors[name]?.message?.toString()} />
    </div>
  );
}
