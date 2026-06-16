import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { periodHref, shiftPeriod } from "@/lib/data";
import { periodLabel } from "@/lib/format";

const months = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" }
];

export function PeriodSelector({
  basePath,
  hasPeriod,
  month,
  status,
  year
}: {
  basePath: string;
  hasPeriod: boolean;
  month: number;
  status?: string;
  year: number;
}) {
  const previous = shiftPeriod(year, month, -1);
  const next = shiftPeriod(year, month, 1);
  const label = hasPeriod ? (status === "ACTIVE" ? "Activo" : status === "CLOSED" ? "Cerrado" : "Borrador") : "Sin registros";
  const tone = hasPeriod ? (status === "ACTIVE" ? "success" : status === "CLOSED" ? "neutral" : "warning") : "info";

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Button asChild className="h-9 w-9" size="icon" title="Mes anterior" variant="outline">
          <Link aria-label="Mes anterior" href={periodHref(basePath, previous.year, previous.month)}>
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-normal text-muted-foreground">Periodo</p>
          <p className="truncate text-base font-semibold">{periodLabel(year, month)}</p>
        </div>
        <Button asChild className="h-9 w-9" size="icon" title="Mes siguiente" variant="outline">
          <Link aria-label="Mes siguiente" href={periodHref(basePath, next.year, next.month)}>
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <form action={basePath} className="grid gap-2 sm:grid-cols-[150px_110px_auto]" method="get">
        <Select aria-label="Mes" defaultValue={String(month)} name="month">
          {months.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input aria-label="Año" defaultValue={year} max={2100} min={2000} name="year" type="number" />
        <Button type="submit">
          <CalendarDays aria-hidden="true" className="h-4 w-4" />
          Ver
        </Button>
      </form>

      <Badge tone={tone}>{label}</Badge>
    </div>
  );
}
