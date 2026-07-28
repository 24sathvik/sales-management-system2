export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole ADMIN)
// - [x] Input Validation (Zod safeParse for POST)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const expenseSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
  category: z.enum(["RENT", "SALARY", "ELECTRICITY", "FUEL", "INTERNET", "MISC", "OTHER"]),
  amount: z.coerce.number().positive(),
  description: z.string().optional(),
  paidOn: z.coerce.date().optional(),
  paymentMode: z.enum(["CASH", "ONLINE", "UPI", "BANK_TRANSFER"]).optional()
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    const expenses = await (prisma as any).monthlyExpense.findMany({
      where: { month, year, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: expenses });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { month, year, category, amount, description, paidOn, paymentMode } = parsed.data;

    const expense = await (prisma as any).monthlyExpense.create({
      data: {
        month, year,
        category,
        amount: new Decimal(amount),
        description: description || null,
        paidOn: paidOn ? new Date(paidOn) : null,
        paymentMode: paymentMode || null,
        createdBy: session?.user?.id || "system",
      },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
