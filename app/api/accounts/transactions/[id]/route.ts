export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { recomputeBalancesFrom } from "@/lib/accounts-utils";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth("ADMIN");
    const body = await req.json();
    // Allowed fields: amount, description, date, mode (NOT type)
    const { amount, description, date, mode } = body;

    const existing = await (prisma as any).counterTransaction.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.deletedAt) {
      return new NextResponse("Not found", { status: 404 });
    }

    const needsRecompute = amount !== undefined && Number(amount) !== Number(existing.amount);

    const updated = await prisma.$transaction(async (tx) => {
      const data: any = {};
      if (amount !== undefined) data.amount = new Decimal(amount);
      if (description !== undefined) data.description = description;
      if (date !== undefined) data.date = new Date(date);
      if (mode !== undefined) data.mode = mode;

      const txn = await (tx as any).counterTransaction.update({
        where: { id: params.id },
        data,
      });

      if (needsRecompute) {
        await recomputeBalancesFrom(tx, existing.createdAt);
        // Re-fetch to get the recomputed value
        return await (tx as any).counterTransaction.findUnique({ where: { id: params.id } });
      }

      return txn;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth("ADMIN");

    const existing = await (prisma as any).counterTransaction.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.deletedAt) {
      return new NextResponse("Not found", { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete
      await (tx as any).counterTransaction.update({
        where: { id: params.id },
        data: { deletedAt: new Date() },
      });

      // Recompute all subsequent balances (using createdAt of deleted record as the pivot)
      await recomputeBalancesFrom(tx, existing.createdAt);
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
