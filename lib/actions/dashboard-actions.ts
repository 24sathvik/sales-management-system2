"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function fetchDashboardStatsAction(startDateParam: string | null, endDateParam: string | null) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
    let endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    if (startDateParam && endDateParam) {
      startOfPeriod = new Date(startDateParam);
      startOfPeriod.setHours(0, 0, 0, 0);
      
      endOfPeriod = new Date(endDateParam);
      endOfPeriod.setHours(23, 59, 59, 999);
    }

    const diffTime = Math.abs(endOfPeriod.getTime() - startOfPeriod.getTime());
    const prevStartOfPeriod = new Date(startOfPeriod.getTime() - diffTime - (24 * 60 * 60 * 1000));
    const prevEndOfPeriod = new Date(startOfPeriod.getTime() - (24 * 60 * 60 * 1000));
    prevEndOfPeriod.setHours(23, 59, 59, 999);

    const baseInvoiceWhere: Prisma.InvoiceWhereInput = { deletedAt: null };
    const baseLeadWhere: Prisma.LeadWhereInput = { deletedAt: null };
    const baseWipWhere: Prisma.WIPCardWhereInput = { deletedAt: null };
    const baseFinalCheckWhere: Prisma.FinalCheckWhereInput = { deletedAt: null };

    if (session.user.role !== "ADMIN") {
      baseInvoiceWhere.createdById = session.user.id;
      baseLeadWhere.createdById = session.user.id;
      baseWipWhere.invoice = { createdById: session.user.id };
      baseFinalCheckWhere.invoice = { createdById: session.user.id };
    }

    const [totalInvoices, prevTotalInvoices, activeInvoices, deliveriesThisWeek, overdueInvoices, prevOverdueInvoices] = await Promise.all([
      prisma.invoice.count({ where: { ...baseInvoiceWhere, createdAt: { gte: startOfPeriod, lte: endOfPeriod } } }),
      prisma.invoice.count({ where: { ...baseInvoiceWhere, createdAt: { gte: prevStartOfPeriod, lte: prevEndOfPeriod } } }),
      prisma.invoice.count({ where: { ...baseInvoiceWhere, status: "ACTIVE" } }),
      prisma.invoice.count({
        where: {
          ...baseInvoiceWhere,
          status: "ACTIVE",
          finalDeliveryDate: { gte: startOfToday, lte: in7Days },
        },
      }),
      prisma.invoice.count({
        where: {
          ...baseInvoiceWhere,
          status: "ACTIVE",
          finalDeliveryDate: { lt: startOfToday },
        },
      }),
      prisma.invoice.count({
        where: {
          ...baseInvoiceWhere,
          status: "ACTIVE",
          finalDeliveryDate: { lt: startOfPeriod },
        },
      }),
    ]);

    const [totalLeads, wipCounts, leadsByStatus] = await Promise.all([
      prisma.lead.count({ where: { ...baseLeadWhere, createdAt: { gte: startOfPeriod, lte: endOfPeriod } } }),
      prisma.wIPCard.groupBy({
        by: ["stageId"],
        where: baseWipWhere,
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["status"],
        where: baseLeadWhere,
        _count: { _all: true },
      }),
    ]);

    const [urgentDeliveries, recentInvoices, pendingFinalChecks, completedFinalChecksThisMonth] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          ...baseInvoiceWhere,
          status: "ACTIVE",
          finalDeliveryDate: { not: null },
        },
        orderBy: { finalDeliveryDate: "asc" },
        take: 20,
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          totalAmount: true,
          finalDeliveryDate: true,
          assignee: { select: { name: true } },
        },
      }),
      prisma.invoice.findMany({
        where: baseInvoiceWhere,
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          customerName: true,
          totalAmount: true,
          finalDeliveryDate: true,
          status: true,
          balancePaid: true,
          wipCards: { select: { stageId: true }, take: 1 },
          assignee: { select: { name: true } },
        },
      }),
      prisma.finalCheck.count({ where: { ...baseFinalCheckWhere, isComplete: false } }),
      prisma.finalCheck.count({
        where: {
          ...baseFinalCheckWhere,
          isComplete: true,
          completedAt: { gte: startOfPeriod, lte: endOfPeriod },
        },
      }),
    ]);

    const allStages = await prisma.workflowStage.findMany({ 
      orderBy: { order: "asc" },
      select: { id: true, name: true, color: true } 
    });
    
    const wipPhases = allStages.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      count: 0
    }));

    wipCounts.forEach((g) => {
      if (!g.stageId) return;
      const phase = wipPhases.find(p => p.id === g.stageId);
      if (phase) phase.count += g._count._all;
    });
    
    const totalWip = wipPhases.reduce((a, b) => a + b.count, 0);

    const leadsStatusMap: Record<string, number> = {
      NEW: 0, CONTACTED: 0, NEGOTIATING: 0, CONVERTED: 0, LOST: 0,
    };
    leadsByStatus.forEach((g) => {
      leadsStatusMap[g.status] = g._count._all;
    });

    return {
      stats: {
        totalInvoices,
        totalInvoicesDelta: prevTotalInvoices > 0 ? Math.round(((totalInvoices - prevTotalInvoices) / prevTotalInvoices) * 100) : 0,
        activeInvoices,
        activeInvoicesDelta: 0,
        deliveriesThisWeek,
        overdueInvoices,
        overdueInvoicesDelta: prevOverdueInvoices > 0 ? Math.round(((overdueInvoices - prevOverdueInvoices) / prevOverdueInvoices) * 100) : 0,
        totalLeads,
        totalWip,
      },
      wipPhases,
      urgentDeliveries: urgentDeliveries.map(inv => ({
        ...inv,
        totalAmount: Number(inv.totalAmount)
      })),
      recentInvoices: recentInvoices.map(inv => ({
        ...inv,
        totalAmount: Number(inv.totalAmount)
      })),
      leadsByStatus: Object.entries(leadsStatusMap).map(([status, count]) => ({ status, count })),
      finalCheck: {
        pending: pendingFinalChecks,
        completedThisMonth: completedFinalChecksThisMonth,
      },
    };

  } catch (error) {
    console.error("Dashboard Stats Action Error:", error);
    throw new Error("Failed to load dashboard stats");
  }
}
