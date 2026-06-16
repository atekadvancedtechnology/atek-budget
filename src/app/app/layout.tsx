import { WalletCards } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { requireUser } from "@/lib/authorization";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link className="flex items-center gap-2 font-semibold" href="/app">
            <span className="rounded-md bg-primary p-2 text-primary-foreground">
              <WalletCards aria-hidden="true" className="h-4 w-4" />
            </span>
            ATEK Budget
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
