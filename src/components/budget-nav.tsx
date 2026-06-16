import {
  BarChart3,
  CalendarClock,
  Landmark,
  PiggyBank,
  ReceiptText,
  Settings,
  TrendingUp,
  Wallet
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const navItems = [
  ["dashboard", "Dashboard", BarChart3],
  ["income", "Ingresos", Wallet],
  ["expenses", "Gastos", ReceiptText],
  ["debts", "Deudas", Landmark],
  ["savings", "Ahorros", PiggyBank],
  ["cashflow", "Flujo", TrendingUp],
  ["history", "Historial", CalendarClock],
  ["settings", "Ajustes", Settings]
] as const;

export function BudgetNav({ budgetId }: { budgetId: string }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
        <nav className="sticky top-16 grid gap-1 p-4">
          {navItems.map(([href, label, Icon]) => (
            <Link
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted")}
              href={`/app/budgets/${budgetId}/${href}`}
              key={href}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-8 border-t bg-card lg:hidden">
        {navItems.map(([href, label, Icon]) => (
          <Link
            aria-label={label}
            className="flex h-14 items-center justify-center text-muted-foreground hover:text-foreground"
            href={`/app/budgets/${budgetId}/${href}`}
            key={href}
            title={label}
          >
            <Icon aria-hidden="true" className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </>
  );
}
