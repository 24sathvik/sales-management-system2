export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";

 // 5 minutes cache

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 50);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    
    // Default to last 6 months if not provided
    let numMonths = 6;
    let endDt = new Date();
    let startDt = new Date(endDt.getFullYear(), endDt.getMonth() - 5, 1);
    
    if (startDateStr && endDateStr) {
      startDt = new Date(startDateStr);
      endDt = new Date(endDateStr);
      // set endDt to end of day
      endDt.setHours(23, 59, 59, 999);
      
      const diffMonths = (endDt.getFullYear() - startDt.getFullYear()) * 12 + (endDt.getMonth() - startDt.getMonth()) + 1;
      numMonths = Math.max(1, diffMonths);
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId parameter" }, { status: 400 });
    }


    // Also fetch the grand total for the exact requested window
    const [grandTotalStats, storeGrandTotalStats] = await Promise.all([
      (prisma.invoice as any).aggregate({
        where: {
          assigneeId: userId,
          createdAt: { gte: startDt, lte: endDt },
          deletedAt: null
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      (prisma.invoice as any).aggregate({
        where: {
          createdAt: { gte: startDt, lte: endDt },
          deletedAt: null
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      })
    ]);

    // Fetch ALL invoices in the window in one parallel shot (2 queries total instead of 2N)
    const [allUserInvoices, allStoreInvoices] = await Promise.all([
      (prisma.invoice as any).findMany({
        where: { assigneeId: userId, createdAt: { gte: startDt, lte: endDt }, deletedAt: null },
        select: { totalAmount: true, createdAt: true },
      }),
      (prisma.invoice as any).findMany({
        where: { createdAt: { gte: startDt, lte: endDt }, deletedAt: null },
        select: { totalAmount: true, createdAt: true },
      }),
    ]);

    // Bucket by month in JS
    const trendData = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const d = new Date(endDt.getFullYear(), endDt.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      // Clamp within actual requested dates
      const actualStart = mStart < startDt ? startDt.getTime() : mStart.getTime();
      const actualEnd = mEnd > endDt ? endDt.getTime() : mEnd.getTime();

      const filterInRange = (inv: any) => {
        const t = new Date(inv.createdAt).getTime();
        return t >= actualStart && t <= actualEnd;
      };

      const monthUser = allUserInvoices.filter(filterInRange);
      const monthStore = allStoreInvoices.filter(filterInRange);

      trendData.push({
        month: d.toLocaleString("default", { month: "short" }) + " '" + String(d.getFullYear()).slice(2),
        invoices: monthUser.length,
        revenue: monthUser.reduce((s: number, inv: any) => s + Number(inv.totalAmount || 0), 0),
        storeInvoices: monthStore.length,
        storeRevenue: monthStore.reduce((s: number, inv: any) => s + Number(inv.totalAmount || 0), 0),
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        totals: {
          invoices: grandTotalStats._count.id || 0,
          revenue: Number(grandTotalStats._sum.totalAmount || 0),
          storeInvoices: storeGrandTotalStats._count.id || 0,
          storeRevenue: Number(storeGrandTotalStats._sum.totalAmount || 0),
        },
        trend: trendData
      } 
    });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
