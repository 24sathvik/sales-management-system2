"use server";

import { getDashboardStats } from "@/lib/queries/dashboardStats";
import { auth } from "@/lib/auth";

export async function fetchDashboardStatsAction(startDate: string | null, endDate: string | null) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const stats = await getDashboardStats(startDate, endDate, session.user.id, session.user.role);
    return stats;
  } catch (error) {
    console.error("Dashboard Stats Action Error:", error);
    throw new Error("Failed to load dashboard stats");
  }
}
