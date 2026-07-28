import { PrismaClient } from "@prisma/client";
import { recomputeBalancesFrom } from "../lib/accounts-utils";
const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill for invoice advances...");
  
  // Find all invoices with advancePaid = true
  const invoices = await (prisma as any).invoice.findMany({
    where: { advancePaid: true, advanceAmount: { gt: 0 } },
    orderBy: { createdAt: "asc" }
  });
  
  console.log(`Found ${invoices.length} invoices with advance payments.`);
  
  let addedCount = 0;
  
  // To avoid duplicate transactions, check if an advance txn already exists for this invoice.
  for (const inv of invoices) {
    const existing = await (prisma as any).counterTransaction.findFirst({
      where: {
        invoiceId: inv.id,
        category: "INVOICE_ADVANCE"
      }
    });
    
    if (!existing) {
      const formattedNum = `INV-${String(inv.invoiceNumber).padStart(4, "0")}`;
      await (prisma as any).counterTransaction.create({
        data: {
          type: "CREDIT",
          mode: inv.advanceMode || "CASH",
          amount: inv.advanceAmount,
          description: `Advance received for ${formattedNum}`,
          category: "INVOICE_ADVANCE",
          invoiceId: inv.id,
          invoiceNumber: formattedNum,
          runningBalance: 0, // temporary filler, recomputed later
          createdBy: inv.createdById || "system",
          createdAt: inv.createdAt,
          date: inv.date || inv.createdAt
        }
      });
      addedCount++;
      console.log(`Backfilled advance for invoice ${formattedNum}`);
    }
  }
  
  console.log(`Added ${addedCount} new advance transactions.`);
  
  if (addedCount > 0) {
    console.log("Recomputing all running balances from the beginning of time...");
    // Find the oldest backfilled transaction date
    const firstTxn = await (prisma as any).counterTransaction.findFirst({
      orderBy: { createdAt: "asc" }
    });
    
    if (firstTxn) {
      await prisma.$transaction(async (tx) => {
        await recomputeBalancesFrom(tx, firstTxn.createdAt);
      });
      console.log("Successfully recomputed balances sequentially.");
    }
  }
  
  console.log("Backfill complete!");
}

main().catch(e => {
  console.error(e);
}).finally(() => {
  prisma.$disconnect();
});
