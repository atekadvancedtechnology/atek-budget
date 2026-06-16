import type { ReactNode } from "react";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {children ? <div className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}
