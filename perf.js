const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  let startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
  let endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const prevStartOfPeriod = new Date(startOfPeriod.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevEndOfPeriod = new Date(startOfPeriod.getTime() - 24 * 60 * 60 * 1000);
  
  const baseInvoiceWhere = { deletedAt: null };
  const baseLeadWhere = { deletedAt: null };
  const baseWipWhere = { deletedAt: null };
  const baseFinalCheckWhere = { deletedAt: null };

  console.log("Warming up Prisma client...");
  await prisma.invoice.count();

  console.time("Dashboard-Batch1-Counts");
  await Promise.all([
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
  console.timeEnd("Dashboard-Batch1-Counts");

  console.time("Dashboard-Batch2-LeadsWIP");
  await Promise.all([
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
  console.timeEnd("Dashboard-Batch2-LeadsWIP");

  console.time("Dashboard-Batch3-FindMany");
  await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...baseInvoiceWhere,
        status: "ACTIVE",
        finalDeliveryDate: { not: null },
      },
      orderBy: { finalDeliveryDate: "asc" },
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
  console.timeEnd("Dashboard-Batch3-FindMany");

  // INDIVIDUAL QUERIES TO FIND THE CULPRIT:
  console.log("\n--- Batch 1 Individual Tests ---");
  
  console.time("Invoice.count createdAt current");
  await prisma.invoice.count({ where: { ...baseInvoiceWhere, createdAt: { gte: startOfPeriod, lte: endOfPeriod } } });
  console.timeEnd("Invoice.count createdAt current");

  console.time("Invoice.count createdAt prev");
  await prisma.invoice.count({ where: { ...baseInvoiceWhere, createdAt: { gte: prevStartOfPeriod, lte: prevEndOfPeriod } } });
  console.timeEnd("Invoice.count createdAt prev");

  console.time("Invoice.count status ACTIVE");
  await prisma.invoice.count({ where: { ...baseInvoiceWhere, status: "ACTIVE" } });
  console.timeEnd("Invoice.count status ACTIVE");

  console.time("Invoice.count deliveriesThisWeek");
  await prisma.invoice.count({
    where: { ...baseInvoiceWhere, status: "ACTIVE", finalDeliveryDate: { gte: startOfToday, lte: in7Days } },
  });
  console.timeEnd("Invoice.count deliveriesThisWeek");

  console.time("Invoice.count overdue");
  await prisma.invoice.count({
    where: { ...baseInvoiceWhere, status: "ACTIVE", finalDeliveryDate: { lt: startOfToday } },
  });
  console.timeEnd("Invoice.count overdue");

  console.time("Invoice.count prevOverdue");
  await prisma.invoice.count({
    where: { ...baseInvoiceWhere, status: "ACTIVE", finalDeliveryDate: { lt: startOfPeriod } },
  });
  console.timeEnd("Invoice.count prevOverdue");
  
  console.time("Lead.count by createdAt");
  await prisma.lead.count({ where: { ...baseLeadWhere, createdAt: { gte: startOfPeriod, lte: endOfPeriod } } });
  console.timeEnd("Lead.count by createdAt");

  console.time("WIPCard.groupBy");
  await prisma.wIPCard.groupBy({ by: ["stageId"], where: baseWipWhere, _count: { _all: true } });
  console.timeEnd("WIPCard.groupBy");

  console.time("Lead.groupBy status");
  await prisma.lead.groupBy({ by: ["status"], where: baseLeadWhere, _count: { _all: true } });
  console.timeEnd("Lead.groupBy status");

  console.time("Invoice.findMany urgentDeliveries");
  await prisma.invoice.findMany({
    where: { ...baseInvoiceWhere, status: "ACTIVE", finalDeliveryDate: { not: null } },
    orderBy: { finalDeliveryDate: "asc" },
    select: { id: true, invoiceNumber: true }
  });
  console.timeEnd("Invoice.findMany urgentDeliveries");

  console.time("FinalCheck.count completedAt");
  await prisma.finalCheck.count({
    where: { ...baseFinalCheckWhere, isComplete: true, completedAt: { gte: startOfPeriod, lte: endOfPeriod } }
  });
  console.timeEnd("FinalCheck.count completedAt");

}

main().catch(console.error).finally(() => prisma.$disconnect());
