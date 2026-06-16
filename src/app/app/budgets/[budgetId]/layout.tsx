import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BudgetNav } from "@/components/budget-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireBudgetAccess } from "@/lib/authorization";

type LayoutProps = {
  children: ReactNode;
  params: Promise<{ budgetId: string }>;
};

export default async function BudgetLayout({ children, params }: LayoutProps) {
  const { budgetId } = await params;
  const access = await requireBudgetAccess(budgetId);

  return (
    <div className="flex">
      <BudgetNav budgetId={budgetId} />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">
        <div className="border-b bg-card">
          <div className="container flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{access.budget.workspace.name}</p>
              <h1 className="text-xl font-semibold tracking-normal sm:text-2xl">{access.budget.name}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href="/app">
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                  Presupuestos
                </Link>
              </Button>
              <Badge tone={access.role === "OWNER" ? "success" : access.role === "EDITOR" ? "info" : "neutral"}>
                {access.role}
              </Badge>
            </div>
          </div>
        </div>
        <div className="container py-4 sm:py-6">{children}</div>
      </main>
    </div>
  );
}
