export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth("ADMIN");
    const body = await req.json();
    const data: any = {};
    if (body.amount !== undefined) data.amount = new Decimal(body.amount);
    if (body.description !== undefined) data.description = body.description;
    if (body.category !== undefined) data.category = body.category;
    if (body.paidOn !== undefined) data.paidOn = body.paidOn ? new Date(body.paidOn) : null;
    if (body.paymentMode !== undefined) data.paymentMode = body.paymentMode || null;

    const updated = await (prisma as any).monthlyExpense.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth("ADMIN");
    await (prisma as any).monthlyExpense.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return new NextResponse("Internal Error", { status: 500 });
  }
}
