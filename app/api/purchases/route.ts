export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (N/A)
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
import { z } from "zod";

const purchaseCreateSchema = z.object({
  invoiceId: z.string().uuid(),
  completedAt: z.string().datetime().optional().or(z.date().optional())
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const leadSource = searchParams.get("leadSource") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "completedAt";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = { equals: category, mode: "insensitive" };
    if (leadSource) where.leadSource = { equals: leadSource, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.completedAt.lte = end;
      }
    }

    const validSorts = ["profit", "billValue", "completedAt", "profitPercentage", "totalProductionCost"];
    const orderByField = validSorts.includes(sortBy) ? sortBy : "completedAt";

    const purchases = await (prisma as any).purchase.findMany({
      where,
      orderBy: { [orderByField]: order },
      select: {
        id: true, invoiceNumber: true, customerName: true, category: true, description: true,
        quantity: true, billValue: true, leadSource: true,
        designer1Name: true, designer1Cost: true, designer1PaymentStatus: true,
        designer2Name: true, designer2Cost: true, designer2PaymentStatus: true,
        printer1Name: true, printer1Cost: true, printer1PaymentStatus: true,
        printer2Name: true, printer2Cost: true, printer2PaymentStatus: true,
        rawMaterial1Name: true, rawMaterial1Cost: true, rawMaterial1PaymentStatus: true,
        rawMaterial2Name: true, rawMaterial2Cost: true, rawMaterial2PaymentStatus: true,
        postProcess1Name: true, postProcess1Cost: true, postProcess1PaymentStatus: true,
        postProcess2Name: true, postProcess2Cost: true, postProcess2PaymentStatus: true,
        totalDesignerCost: true, totalPrinterCost: true, totalRawMaterialCost: true, totalPostProcessCost: true,
        totalProductionCost: true, profit: true, profitPercentage: true,
        completedAt: true, notes: true
      }
    });

    return NextResponse.json({ success: true, data: purchases });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = purchaseCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { invoiceId, completedAt } = parsed.data;

    // Check for existing purchase
    const existing = await (prisma as any).purchase.findUnique({ where: { invoiceId } });
    if (existing) return NextResponse.json({ success: true, data: existing });

    const invoice = await (prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });

    const purchase = await (prisma as any).purchase.create({
      data: {
        invoiceId,
        invoiceNumber: `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`,
        customerName: invoice.customerName,
        description: invoice.description,
        category: invoice.category || "Uncategorized",
        quantity: invoice.quantity,
        billValue: invoice.totalAmount,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: purchase }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
