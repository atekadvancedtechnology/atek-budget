import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { LoginButton } from "@/components/login-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/app");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar a ATEK Budget</CardTitle>
          <CardDescription>Usa Google para acceder a tus workspaces y presupuestos familiares.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>
    </main>
  );
}
