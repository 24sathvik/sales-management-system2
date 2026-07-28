export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN"); // Protected
    
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const numMonths = parseInt(searchParams.get("months") || "12");
    const catStartStr = searchParams.get("catStart");
    const catEndStr = searchParams.get("catEnd");
    
    const now = new Date();

    // Compute single date range covering all N months
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - numMonths + 1, 1);

    // Category Distribution date range
    const catStart = catStartStr ? new Date(catStartStr) : rangeStart;
    const catEnd = catEndStr ? (() => { const d = new Date(catEndStr); d.setHours(23, 59, 59, 999); return d; })() : now;

    // Build the OR array for monthly expenses
    const expenseOrList = [];
    for (let i = 0; i < numMonths; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        expenseOrList.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    const categoriesAggrPromise = (prisma.invoice as any).groupBy({
      by: ['category'],
      where: { createdAt: { gte: catStart, lte: catEnd }, deletedAt: null },
      _sum: { totalAmount: true },
    });

    const expensesAggrPromise = (prisma.monthlyExpense as any).groupBy({
      by: ['month', 'year'],
      where: { deletedAt: null, OR: expenseOrList },
      _sum: { amount: true },
    });

    const monthPromises = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      
      monthPromises.push(Promise.all([
        (prisma.invoice as any).count({
          where: { createdAt: { gte: mStart, lt: mEnd }, deletedAt: null }
        }),
        (prisma.purchase as any).aggregate({
          where: { deletedAt: null, completedAt: { gte: mStart, lt: mEnd } },
          _sum: { billValue: true, totalProductionCost: true }
        }),
        Promise.resolve({ month: d.getMonth() + 1, year: d.getFullYear(), date: d })
      ]));
    }

    const [categoriesAggr, expensesAggr, ...monthResults] = await Promise.all([
      categoriesAggrPromise,
      expensesAggrPromise,
      ...monthPromises
    ]);

    const monthlyData = monthResults.map(([invCount, purcAgg, info]: any) => {
      const mGrossRevenue = Number(purcAgg._sum.billValue || 0);
      const mProductionCost = Number(purcAgg._sum.totalProductionCost || 0);
      const mGrossProfit = mGrossRevenue - mProductionCost;

      const mExp = (expensesAggr as any[]).find((e: any) => e.month === info.month && e.year === info.year);
      const mExpTotal = Number(mExp?._sum?.amount || 0);
      
      const netProfit = mGrossProfit - mExpTotal;

      return {
        month: info.date.toLocaleString("en-IN", { month: "short", year: "numeric" }),
        totalInvoices: invCount,
        revenue: mGrossRevenue,
        netProfit,
      };
    });

    const categoryDistribution = categoriesAggr
      .map((c: any) => ({
        name: c.category || "Uncategorized",
        value: Number(c._sum.totalAmount || 0)
      }))
      .filter((c: any) => c.value > 0)
      .sort((a: any, b: any) => b.value - a.value);

    return NextResponse.json({ 
      success: true, 
      data: {
        monthlyData,
        categoryDistribution
      } 
    }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" }
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
