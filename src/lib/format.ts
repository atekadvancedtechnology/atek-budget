import { toNumber, type DecimalLike } from "@/lib/finance";

export function formatCurrency(value: DecimalLike, currency = "RD$") {
  return `${currency} ${toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function formatPercent(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

export function periodLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("es-DO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
