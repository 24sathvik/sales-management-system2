export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole ADMIN)
// - [x] Input Validation (N/A)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const invoices = await (prisma as any).invoice.findMany({
      where: { balancePaid: false, deletedAt: null, status: "ACTIVE" },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        phone: true,
        totalAmount: true,
        advanceAmount: true,
        balance: true,
        finalDeliveryDate: true,
        assignee: { select: { name: true } },
      },
      orderBy: { finalDeliveryDate: "asc" },
    });

    const totalReceivable = invoices.reduce((s: number, i: any) => s + Number(i.balance || 0), 0);

    return NextResponse.json({ success: true, data: { invoices, totalReceivable } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
