import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ budgetId: string }>;
};

export default async function BudgetIndexPage({ params }: PageProps) {
  const { budgetId } = await params;
  redirect(`/app/budgets/${budgetId}/dashboard`);
}
