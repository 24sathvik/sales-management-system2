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
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const [users, stats, closedStats, allClosedThisMonth] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true }
      }),
      (prisma.invoice as any).groupBy({
        by: ['assigneeId'],
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          deletedAt: null
        },
        _count: { id: true },
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      (prisma.invoice as any).groupBy({
        by: ['assigneeId'],
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          status: 'CLOSED',
          deletedAt: null
        },
        _count: { id: true },
      }),
      (prisma as any).invoice.findMany({
        where: { status: 'CLOSED', createdAt: { gte: startOfMonth, lte: endOfMonth }, deletedAt: null },
        select: { assigneeId: true, createdAt: true, updatedAt: true }
      })
    ]);

    const [overdueStats, thisWeekInvoices, historicalCounts] = await Promise.all([
      (prisma.invoice as any).groupBy({
        by: ['assigneeId'],
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          finalDeliveryDate: { lt: new Date() },
          status: 'ACTIVE',
          deletedAt: null
        },
        _count: { id: true },
      }),
      (prisma as any).invoice.findMany({
        where: { createdAt: { gte: startOfWeek }, deletedAt: null },
        select: { assigneeId: true, createdAt: true }
      }),
      (prisma.invoice as any).groupBy({
        by: ['assigneeId'],
        where: { deletedAt: null },
        _count: { id: true }
      })
    ]);

    const userMap = new Map(users.map(u => [u.id, u.name]));
    const closedMap = new Map(closedStats.map((s: any) => [s.assigneeId, s._count.id]));

    const speedMap = new Map<string, number[]>();
    for (const inv of allClosedThisMonth) {
      const timeMs = inv.updatedAt.getTime() - inv.createdAt.getTime();
      if (!speedMap.has(inv.assigneeId)) speedMap.set(inv.assigneeId, []);
      speedMap.get(inv.assigneeId)!.push(timeMs);
    }
    const avgSpeedMap = new Map<string, number>();
    speedMap.forEach((times: number[], id: string) => {
      avgSpeedMap.set(id, times.reduce((a: number, b: number) => a + b, 0) / times.length);
    });

    const overdueMap = new Map(overdueStats.map((s: any) => [s.assigneeId, s._count.id]));

    const streakMap = new Map<string, Set<number>>();
    for (const inv of thisWeekInvoices) {
      if (!streakMap.has(inv.assigneeId)) streakMap.set(inv.assigneeId, new Set());
      streakMap.get(inv.assigneeId)!.add(new Date(inv.createdAt).getDay());
    }

    const histMap = new Map(historicalCounts.map((s: any) => [s.assigneeId, s._count.id]));

    // Compute badges & assemble results
    let maxRevenue = 0;
    let revenueKing = "";
    
    let maxClosed = 0;
    let topCloser = "";

    let bestSpeed = Infinity;
    let speedDemon = "";

    const userResults = (stats as any[]).map((s: any) => {
      const invoiceCount = Number(s._count?.id || 0);
      const revenue = Number(s._sum?.totalAmount || 0);
      const avgInvoiceValue = Number(s._avg?.totalAmount || 0);
      const closedCount = Number(closedMap.get(s.assigneeId) || 0);
      const completionRate = invoiceCount > 0 ? (closedCount / invoiceCount) * 100 : 0;
      
      if (revenue > maxRevenue) { maxRevenue = revenue; revenueKing = s.assigneeId; }
      if (closedCount > maxClosed) { maxClosed = closedCount; topCloser = s.assigneeId; }
      const speed = avgSpeedMap.get(s.assigneeId) || Infinity;
      if (speed < bestSpeed) { bestSpeed = speed; speedDemon = s.assigneeId; }

      return {
        userId: s.assigneeId,
        name: userMap.get(s.assigneeId) || "Unknown",
        invoiceCount,
        revenue,
        avgInvoiceValue,
        completionRate,
        badges: [] as string[]
      };
    });

    const allUsersResult = users.map(u => {
      const existing = userResults.find((r: any) => r.userId === u.id);
      if (existing) return existing;
      return {
        userId: u.id,
        name: u.name,
        invoiceCount: 0,
        revenue: 0,
        avgInvoiceValue: 0,
        completionRate: 0,
        badges: [] as string[]
      };
    });

    // Distribute badges
    for (const user of allUsersResult) {
      if (user.userId === topCloser && maxClosed > 0) user.badges.push("Top Closer");
      if (user.userId === revenueKing && maxRevenue > 0) user.badges.push("Revenue King/Queen");
      if (user.userId === speedDemon && bestSpeed !== Infinity) user.badges.push("Speed Demon");
      
      const overdues = Number(overdueMap.get(user.userId) || 0);
      if (user.invoiceCount > 0 && overdues === 0) user.badges.push("On Target");
      
      const streakDays = Number(streakMap.get(user.userId)?.size || 0);
      if (streakDays >= 5) user.badges.push("On a Streak"); // Created invoices on 5 distinct days this week

      const histCount = Number(histMap.get(user.userId) || 0);
      if (histCount > 0 && histCount <= 5) user.badges.push("First Invoice"); // still relatively new!
    }

    allUsersResult.sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ success: true, data: allUsersResult });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
