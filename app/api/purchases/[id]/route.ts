export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole)
// - [x] UUID Validation (isValidUUID)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { z } from "zod";

const purchaseUpdateSchema = z.object({
  designer1Name: z.string().nullable().optional(),
  designer1Cost: z.number().nullable().optional(),
  designer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  designer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),
  
  designer2Name: z.string().nullable().optional(),
  designer2Cost: z.number().nullable().optional(),
  designer2PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  designer2PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  printer1Name: z.string().nullable().optional(),
  printer1Cost: z.number().nullable().optional(),
  printer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  printer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  printer2Name: z.string().nullable().optional(),
  printer2Cost: z.number().nullable().optional(),
  printer2PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  printer2PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  rawMaterial1Name: z.string().nullable().optional(),
  rawMaterial1Cost: z.number().nullable().optional(),
  rawMaterial1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  rawMaterial1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  rawMaterial2Name: z.string().nullable().optional(),
  rawMaterial2Cost: z.number().nullable().optional(),
  rawMaterial2PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  rawMaterial2PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  postProcess1Name: z.string().nullable().optional(),
  postProcess1Cost: z.number().nullable().optional(),
  postProcess1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  postProcess1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  postProcess2Name: z.string().nullable().optional(),
  postProcess2Cost: z.number().nullable().optional(),
  postProcess2PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  postProcess2PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).nullable().optional(),

  notes: z.string().nullable().optional(),
}).strip();

function toNum(v: any): number {
  if (!v) return 0;
  return typeof v === "object" && v instanceof Decimal ? Number(v) : Number(v);
}

function computeFields(data: any, current: any) {
  const merged = { ...current, ...data };

  const d = (v: any) => new Decimal(v || 0);

  const totalDesignerCost = d(merged.designer1Cost).plus(d(merged.designer2Cost));
  const totalPrinterCost = d(merged.printer1Cost).plus(d(merged.printer2Cost));
  const totalRawMaterialCost = d(merged.rawMaterial1Cost).plus(d(merged.rawMaterial2Cost));
  const totalPostProcessCost = d(merged.postProcess1Cost).plus(d(merged.postProcess2Cost));
  const totalProductionCost = totalDesignerCost.plus(totalPrinterCost).plus(totalRawMaterialCost).plus(totalPostProcessCost);
  const billValue = d(merged.billValue);
  const profit = billValue.minus(totalProductionCost);
  const profitPercentage = billValue.gt(0) ? profit.div(billValue).times(100) : new Decimal(0);

  return {
    totalDesignerCost,
    totalPrinterCost,
    totalRawMaterialCost,
    totalPostProcessCost,
    totalProductionCost,
    profit,
    profitPercentage,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const purchase = await (prisma as any).purchase.findUnique({ where: { id } });
    if (!purchase) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const formattedData = Object.fromEntries(
      Object.entries(purchase).map(([k, v]) => [k, v instanceof Decimal ? v.toNumber() : v])
    );

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const parsed = purchaseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const current = await (prisma as any).purchase.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const computed = computeFields(parsed.data, current);

    const updated = await (prisma as any).purchase.update({
      where: { id },
      data: { ...parsed.data, ...computed },
    });

    const formattedData = Object.fromEntries(
      Object.entries(updated).map(([k, v]) => [k, v instanceof Decimal ? v.toNumber() : v])
    );

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const deleted = await (prisma as any).purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
