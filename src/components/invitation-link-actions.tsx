"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InvitationLinkActions({ status, token }: { status: string; token: string }) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const invitePath = `/invite/${token}`;

  if (status !== "PENDING") {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  function copyLink() {
    startTransition(async () => {
      await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Input aria-label="Link de invitacion" className="h-8 min-w-0 sm:max-w-72" readOnly value={invitePath} />
      <div className="flex gap-1">
        <Button disabled={isPending} size="sm" type="button" variant="outline" onClick={copyLink}>
          {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link aria-label="Abrir invitacion" href={invitePath}>
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
