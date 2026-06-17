import { z } from "zod";

const money = z.coerce.number().min(0, "El monto no puede ser negativo.");
const positiveMoney = z.coerce.number().positive("El monto debe ser mayor que cero.");

export const createBudgetSchema = z.object({
  workspaceName: z.string().min(2, "El nombre del hogar es obligatorio."),
  budgetName: z.string().min(2, "El nombre del presupuesto es obligatorio.")
});

export const incomeSchema = z.object({
  responsibleName: z.string().min(1, "El responsable es obligatorio."),
  source: z.string().min(1, "La fuente es obligatoria."),
  amount: money,
  amountType: z.enum(["FIXED", "VARIABLE", "ESTIMATED"]),
  frequency: z.enum([
    "ONE_TIME",
    "DAILY",
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "BIMONTHLY",
    "QUARTERLY",
    "SEMIANNUAL",
    "ANNUAL",
    "IRREGULAR",
    "CUSTOM"
  ]),
  startDate: z.string().min(1, "La fecha de inicio es obligatoria."),
  endDate: z.string().optional(),
  customRule: z.string().optional(),
  expectedPaymentDays: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  notes: z.string().optional()
});

export const incomeReceiptSchema = z.object({
  incomeId: z.string().optional(),
  responsibleName: z.string().min(1, "El responsable es obligatorio."),
  source: z.string().min(1, "La fuente es obligatoria."),
  amount: money,
  receivedDate: z.string().min(1, "La fecha recibida es obligatoria."),
  notes: z.string().optional()
});

export const expenseSchema = z.object({
  name: z.string().min(1, "El nombre del gasto es obligatorio."),
  responsibleName: z.string().min(1, "El responsable es obligatorio."),
  categoryId: z.string().min(1, "La categoría es obligatoria."),
  amountBudgetedMonthly: money,
  amountQ1: money,
  amountQ2: money,
  bankAccountId: z.string().optional(),
  actualAmount: money.optional(),
  expenseDate: z.string().optional(),
  isRecurring: z.coerce.boolean().default(true),
  notes: z.string().optional()
});

export const expensePaymentSchema = z.object({
  expenseId: z.string().optional(),
  name: z.string().min(1, "El nombre del gasto es obligatorio."),
  responsibleName: z.string().min(1, "El responsable es obligatorio."),
  categoryId: z.string().min(1, "La categoría es obligatoria."),
  bankAccountId: z.string().optional(),
  amount: positiveMoney,
  paidDate: z.string().min(1, "La fecha de pago es obligatoria."),
  notes: z.string().optional()
});

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(1, "El nombre de la categoría es obligatorio."),
  icon: z.string().trim().optional(),
  recommendedMaxPercent: z.coerce
    .number()
    .min(0, "La meta no puede ser negativa.")
    .max(100, "La meta no puede ser mayor a 100%.")
});

export const debtSchema = z.object({
  name: z.string().min(1, "El nombre de la deuda es obligatorio."),
  entity: z.string().min(1, "La entidad es obligatoria."),
  responsibleName: z.string().min(1, "El responsable es obligatorio."),
  pendingBalance: money,
  monthlyPayment: money,
  annualInterestRate: money,
  remainingMonths: z.coerce.number().int().min(0),
  strategy: z.enum(["AVALANCHE", "SNOWBALL", "CUSTOM"]),
  notes: z.string().optional()
});

export const savingGoalSchema = z.object({
  name: z.string().min(1, "El destino de ahorro es obligatorio."),
  monthlyTarget: money,
  contributedThisMonth: money,
  accumulatedBalance: money,
  institution: z.string().min(1, "La institución es obligatoria."),
  priority: z.coerce.number().int().min(1).max(4),
  notes: z.string().optional()
});

export const invitationSchema = z.object({
  email: z.string().email("Debes introducir un email válido."),
  role: z.enum(["EDITOR", "VIEWER"])
});
