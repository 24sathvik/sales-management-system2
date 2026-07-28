import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getDashboardStats(startDateParam: string | null, endDateParam: string | null, userId: string, role: string) {
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

  if (role !== "ADMIN") {
    baseInvoiceWhere.createdById = userId;
    baseLeadWhere.createdById = userId;
    baseWipWhere.invoice = { createdById: userId };
    baseFinalCheckWhere.invoice = { createdById: userId };
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
    })
  ]);

  const [finalCheckCounts, recentInvoices, activeWipCards] = await Promise.all([
    prisma.finalCheck.count({
      where: { ...baseFinalCheckWhere, isComplete: false },
    }),
    prisma.invoice.findMany({
      where: baseInvoiceWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        status: true,
        createdAt: true,
        totalAmount: true,
      },
    }),
    prisma.wIPCard.findMany({
      where: { ...baseWipWhere, invoice: { status: "ACTIVE" } },
      include: {
        invoice: { select: { customerName: true, finalDeliveryDate: true } },
        stage: { select: { name: true } },
      },
    })
  ]);

  const pipelineStatus = activeWipCards.reduce((acc, card) => {
    if (!card.stageId) return acc;
    const stageName = card.stage?.name || 'Unknown';
    acc[stageName] = (acc[stageName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalInvoices,
    totalInvoicesChange: calculateChange(totalInvoices, prevTotalInvoices),
    activeInvoices,
    activeInvoicesChange: 0,
    deliveriesThisWeek,
    overdueInvoices,
    overdueChange: calculateChange(overdueInvoices, prevOverdueInvoices),
    totalLeads,
    totalLeadsChange: 0,
    pipelineStatus,
    recentInvoices,
    finalChecksPending: finalCheckCounts,
    urgentDeliveries: [],
    monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({ month: new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }), amount: Math.floor(Math.random() * 500000) })), // Keeping placeholder for now as in original
    topPerformers: [], 
    leadsByStatus: leadsByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count._all;
      return acc;
    }, {} as Record<string, number>),
  };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
