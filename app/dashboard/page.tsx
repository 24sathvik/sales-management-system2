import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { fetchDashboardStatsAction } from "@/lib/actions/dashboard-actions";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // 1. Fetch initial stats
  const initialStats = await fetchDashboardStatsAction(defaultStart, defaultEnd);

  // 2. Fetch initial recent quotations (was previously using Supabase client in Dashboard)
  const baseWhere = session.user.role !== "ADMIN" ? { createdBy: session.user.id, deletedAt: null } : { deletedAt: null };
  const initialQuotations = await prisma.quotation.findMany({
    where: baseWhere,
    orderBy: { createdAt: "desc" },
    take: 5,
  }).then(list => list.map(q => ({
    ...q,
    // Map to snake_case for the frontend which expects Supabase-style keys currently
    quotation_number: q.quotationNumber,
    customer_name: q.customerName,
    created_at: q.createdAt,
    total_amount: q.totalAmount,
    status: q.status,
  })));

  // 3. Fetch initial quotation stats for the month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const initialQuotationStatsData = await prisma.quotation.findMany({
    where: {
      ...baseWhere,
      createdAt: { gte: startOfMonth }
    },
    select: { status: true, createdAt: true }
  }).then(list => list.map(q => ({
    status: q.status,
    created_at: q.createdAt,
  })));

  return (
    <DashboardClient 
      initialStats={initialStats} 
      initialQuotations={initialQuotations}
      initialQuotationStats={initialQuotationStatsData}
    />
  );
}
