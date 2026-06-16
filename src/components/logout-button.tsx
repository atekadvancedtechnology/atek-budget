"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button type="button" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
      <LogOut aria-hidden="true" className="h-4 w-4" />
      Salir
    </Button>
  );
}
