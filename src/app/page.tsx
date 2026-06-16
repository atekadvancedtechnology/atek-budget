import { ArrowRight, BadgeDollarSign, BarChart3, CalendarClock, UsersRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="container grid min-h-[88vh] gap-10 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase text-primary">Presupuesto Familiar ATEK</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
              ATEK Budget
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              Una app colaborativa para administrar ingresos, gastos reales, deudas, ahorros, quincenas e historial
              mensual de un hogar compartido.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">
                Entrar
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app">Ver presupuestos</Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Roles", "Owner, Editor y Viewer", UsersRound],
              ["Historial", "Periodos mensuales", CalendarClock],
              ["Dashboard", "Datos desde PostgreSQL", BarChart3]
            ].map(([title, text, Icon]) => (
              <div key={title as string} className="rounded-lg border bg-card p-4">
                <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold">{title as string}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text as string}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-lg border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm text-muted-foreground">Junio 2026</p>
                <p className="text-xl font-semibold">Presupuesto Familiar Principal</p>
              </div>
              <BadgeDollarSign aria-hidden="true" className="h-8 w-8 text-primary" />
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-3">
              {[
                ["Ingresos", "RD$ 126,156.84", "bg-emerald-50 text-emerald-700"],
                ["Gastos reales", "RD$ 105,200.00", "bg-rose-50 text-rose-700"],
                ["Ahorro", "RD$ 12,000.00", "bg-sky-50 text-sky-700"]
              ].map(([label, value, className]) => (
                <div key={label} className={`rounded-lg p-4 ${className}`}>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="mt-2 text-lg font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="space-y-3">
                {[
                  ["Casa", "24,300", "32%"],
                  ["Comida", "17,500", "23%"],
                  ["Transporte", "11,200", "15%"],
                  ["Préstamos", "21,500", "28%"]
                ].map(([name, amount, width]) => (
                  <div key={name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="font-medium">RD$ {amount}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {["Q1 ingreso", "Q1 resto", "Q2 ingreso", "Q2 resto"].map((label, index) => (
                  <div key={label} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className={`mt-3 h-16 rounded-md ${index % 2 === 0 ? "bg-sky-100" : "bg-emerald-100"}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
