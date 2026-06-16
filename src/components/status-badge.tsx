import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "OK" || status === "ACTIVE" || status === "ACCEPTED"
      ? "success"
      : status === "PENDING" || status === "DRAFT"
        ? "warning"
        : status === "EXCEEDED" || status === "CANCELLED" || status === "EXPIRED"
          ? "danger"
          : "info";

  const label: Record<string, string> = {
    OK: "OK",
    PENDING: "Pendiente",
    EXCEEDED: "Excedido",
    ACTIVE: "Activo",
    DRAFT: "Borrador",
    CLOSED: "Cerrado",
    PAID: "Pagada",
    CANCELLED: "Cancelado",
    ACCEPTED: "Aceptada",
    EXPIRED: "Expirada"
  };

  return <Badge tone={tone}>{label[status] ?? status}</Badge>;
}
