/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Recomputes runningBalance for ALL CounterTransactions created AFTER `afterCreatedAt`
 * in chronological order, using the balance of the transaction immediately preceding them.
 * Must be called inside a Prisma $transaction context.
 */
export async function recomputeBalancesFrom(
  tx: any,
  afterCreatedAt: Date,
) {
  // Find the latest non-deleted transaction BEFORE the cutoff — its balance is our starting point
  const prev = await tx.counterTransaction.findFirst({
    where: { deletedAt: null, createdAt: { lt: afterCreatedAt } },
    orderBy: { createdAt: "desc" },
  });

  let runningBalance: Decimal = prev ? new Decimal(prev.runningBalance) : new Decimal(0);

  // Fetch all subsequent non-deleted transactions in order
  const toUpdate = await tx.counterTransaction.findMany({
    where: { deletedAt: null, createdAt: { gte: afterCreatedAt } },
    orderBy: { createdAt: "asc" },
  });

  for (const txn of toUpdate) {
    if (txn.type === "CREDIT") {
      runningBalance = runningBalance.plus(new Decimal(txn.amount));
    } else {
      runningBalance = runningBalance.minus(new Decimal(txn.amount));
    }
    await tx.counterTransaction.update({
      where: { id: txn.id },
      data: { runningBalance },
    });
  }

  return runningBalance;
}

/**
 * Get current net balance (total of all non-deleted transactions).
 * Returns { total, cash, online, upi, bankTransfer, lastUpdated }
 */
export async function getCurrentCounterBalance() {
  const txns = await (prisma as any).counterTransaction.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { runningBalance: true, mode: true, createdAt: true },
  });

  if (txns.length === 0) {
    return { total: 0, cash: 0, online: 0, upi: 0, lastUpdated: null };
  }

  // Running balance of most recent transaction IS the net total
  const total = Number(txns[0].runningBalance);

  // Per-mode breakdown: sum credits - debits per mode
  const aggs = await (prisma as any).counterTransaction.groupBy({
    by: ["type", "mode"],
    where: { deletedAt: null },
    _sum: { amount: true },
  });

  let cash = 0, online = 0, upi = 0;
  let totalReceived = 0, totalAdjustments = 0;
  
  for (const group of aggs) {
    const amt = Number(group._sum.amount || 0);
    if (group.type === "CREDIT") {
      totalReceived += amt;
      if (group.mode === "CASH") cash += amt;
      else if (group.mode === "ONLINE" || group.mode === "BANK_TRANSFER") online += amt;
      else if (group.mode === "UPI") upi += amt;
    } else {
      totalAdjustments += amt;
      if (group.mode === "CASH") cash -= amt;
      else if (group.mode === "ONLINE" || group.mode === "BANK_TRANSFER") online -= amt;
      else if (group.mode === "UPI") upi -= amt;
    }
  }

  return { total, cash, online, upi, lastUpdated: txns[0].createdAt, totalReceived, totalAdjustments };
}
