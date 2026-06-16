import { WorkspaceRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BudgetAccess = Awaited<ReturnType<typeof requireBudgetAccess>>;

export function canEdit(role: WorkspaceRole) {
  return role === "OWNER" || role === "EDITOR";
}

export function canManage(role: WorkspaceRole) {
  return role === "OWNER";
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user?.id && user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: {
        email: user.email
      }
    });

    if (dbUser) {
      return {
        ...user,
        id: dbUser.id
      };
    }
  }

  if (!user?.id) {
    redirect("/login");
  }
  return user;
}

export async function requireBudgetAccess(budgetId: string) {
  const user = await requireUser();
  let budget = await prisma.budget.findFirst({
    where: {
      id: budgetId,
      workspace: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  if (!budget && user.email) {
    budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        workspace: {
          members: {
            some: {
              user: {
                email: user.email
              }
            }
          }
        }
      },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
  }

  if (!budget) {
    notFound();
  }

  const member = budget.workspace.members.find(
    (workspaceMember) => workspaceMember.userId === user.id || workspaceMember.user.email === user.email
  );
  if (!member) {
    notFound();
  }

  return {
    user,
    budget,
    role: member.role,
    canEdit: canEdit(member.role),
    canManage: canManage(member.role)
  };
}

export async function requireBudgetRole(budgetId: string, roles: WorkspaceRole[]) {
  const access = await requireBudgetAccess(budgetId);
  if (!roles.includes(access.role)) {
    throw new Error("No tienes permiso para realizar esta acción en este presupuesto.");
  }
  return access;
}
