import { supabase } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function fetchAIContext() {
  try {
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);
    
    // Previous month string for trend
    let prevM = now.getMonth();
    let prevY = now.getFullYear();
    if (prevM === 0) {
      prevM = 12;
      prevY--;
    }
    const prevMonthStr = `${prevY}-${prevM.toString().padStart(2, '0')}`;

    // Get Invoices, WIP, Purchases from Prisma
    const [invs, wips, purchases] = await Promise.all([
      prisma.invoice.findMany({ 
        where: { deletedAt: null },
        select: { 
          id: true, invoiceNumber: true, customerName: true, status: true, finalDeliveryDate: true,
          totalAmount: true, balance: true, createdAt: true 
        }
      }),
      prisma.wIPCard.findMany({ 
        where: { deletedAt: null },
        select: { id: true, invoiceNumber: true, stage: { select: { name: true } }, updatedAt: true }
      }),
      prisma.purchase.findMany({
        where: { deletedAt: null },
        select: { invoiceNumber: true, customerName: true, profit: true, profitPercentage: true, totalProductionCost: true }
      })
    ]);

    // Get Quotations from Supabase
    const { data: quotations } = await supabase.from('quotations').select('id, status, created_at');
    const quos = quotations || [];

    const activeInvoices = invs.filter(i => i.status === 'ACTIVE');
    const pendingReceivables = invs.reduce((acc, i) => acc + Number(i.balance || 0), 0);

    return {
      invoices: invs,
      activeInvoices,
      wips,
      purchases,
      quotations: quos,
      currentMonthStr,
      prevMonthStr,
      pendingReceivables,
    };
  } catch (error) {
    console.error("AI Context fetch failed:", error);
    // Return sensible fallback to not break engine
    return {
      invoices: [],
      activeInvoices: [],
      wips: [],
      purchases: [],
      quotations: [],
      currentMonthStr: "Unknown",
      prevMonthStr: "Unknown",
      pendingReceivables: 0,
    };
  }
}
