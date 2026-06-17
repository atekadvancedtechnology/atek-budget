import { WalletCards } from "lucide-react";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LoginButton } from "@/components/login-button";
import { LogoutButton } from "@/components/logout-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptInvitationAction } from "@/lib/actions";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  const invitation = await prisma.invitation.findUnique({
    where: {
      token
    },
    include: {
      invitedBy: true,
      workspace: {
        include: {
          budgets: {
            orderBy: {
              createdAt: "asc"
            },
            select: {
              id: true,
              name: true
            },
            take: 1
          }
        }
      }
    }
  });

  if (!invitation) notFound();

  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.toLowerCase();
  const invitedEmail = invitation.email.toLowerCase();
  const status = invitation.status === "PENDING" && invitation.expiresAt < new Date() ? "EXPIRED" : invitation.status;
  const budget = invitation.workspace.budgets[0];
  const budgetHref = budget ? `/app/budgets/${budget.id}/dashboard` : "/app";
  const callbackUrl = `/invite/${token}`;
  const canAccept = status === "PENDING" && sessionEmail === invitedEmail;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <span className="rounded-md bg-primary p-2 text-primary-foreground">
              <WalletCards aria-hidden="true" className="h-4 w-4" />
            </span>
            ATEK Budget
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Invitacion a {invitation.workspace.name}</CardTitle>
              <CardDescription>
                {invitation.invitedBy?.email
                  ? `${invitation.invitedBy.email} te invito a colaborar en este workspace.`
                  : "Te invitaron a colaborar en este workspace."}
              </CardDescription>
            </div>
            <StatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 rounded-lg bg-muted p-4 sm:grid-cols-2">
            <Info label="Correo invitado" value={invitation.email} />
            <Info label="Rol" value={invitation.role} />
            <Info label="Vence" value={formatInviteDate(invitation.expiresAt)} />
            <Info label="Presupuesto" value={budget?.name ?? "Workspace"} />
          </div>

          {!session?.user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Inicia sesion con Google usando el correo invitado para aceptar el acceso.
              </p>
              <LoginButton callbackUrl={callbackUrl} />
            </div>
          ) : sessionEmail !== invitedEmail ? (
            <div className="space-y-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <p>
                Estas conectado como {session.user.email}, pero esta invitacion es para {invitation.email}.
              </p>
              <LogoutButton callbackUrl={callbackUrl} />
            </div>
          ) : canAccept ? (
            <form action={acceptInvitationAction.bind(null, token)}>
              <Button type="submit">Aceptar invitacion</Button>
            </form>
          ) : status === "ACCEPTED" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Esta invitacion ya fue aceptada.</p>
              <Button asChild>
                <Link href={budgetHref}>Ir al presupuesto</Link>
              </Button>
            </div>
          ) : (
            <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">
              Esta invitacion no esta disponible. Pide que te envien una nueva.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function formatInviteDate(date: Date) {
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Santo_Domingo"
  }).format(date);
}
