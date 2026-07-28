export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse)
// - [x] UUID Validation (isValidUUID)
// - [x] SQL Injection protection (Prisma ORM parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { invoiceCreateSchema } from "@/lib/validations";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // DB Query uses Prisma ORM which automatically parameterizes inputs, preventing SQL injection
    const invoice = await (prisma.invoice as any).findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = invoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const quantity = Number(data.quantity);
    const unitRate = Number(data.unitRate);
    const toleranceQuantity = 0; // Deprecated field
    const totalAmount = quantity * unitRate;
    const advanceAmount = data.advancePaid ? Number(data.advanceAmount || 0) : null;
    let balance: number | null = totalAmount;
    if (data.advancePaid && advanceAmount !== null) {
      balance = totalAmount - advanceAmount;
    }

    // DB Query uses Prisma ORM which automatically parameterizes inputs
    const result = await prisma.$transaction(async (tx) => {
      // Fetch existing invoice to check its current invoiceNumber
      const currentInvoice = await (tx as any).invoice.findUnique({ where: { id } });

      if (data.invoiceNumber && currentInvoice.invoiceNumber !== data.invoiceNumber) {
        const existing = await (tx as any).invoice.findUnique({
          where: { invoiceNumber: data.invoiceNumber }
        });
        if (existing) {
          throw new Error(`Invoice number ${data.invoiceNumber} is already in use.`);
        }
      }

      const updateData: any = {
        customerName: data.customerName,
        phone: data.phone,
        brideName: data.brideName || "",
        groomName: data.groomName || "",
        modelNumber: data.modelNumber || "",
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        quantity,
        toleranceQuantity,
        unitRate,
        totalAmount,
        advancePaid: data.advancePaid,
        advanceAmount,
        advanceMode: data.advancePaid && data.advanceMode ? data.advanceMode : null,
        balance,
        balancePaid: balance !== null && balance <= 0,
        balanceMode: data.balanceMode || null,
        estimatedDesignTime: data.estimatedDesignTime || "",
        estimatedPrintTime: data.estimatedPrintTime || "",
        packing: data.packing,
        printingColor: data.printingColor,
        designer: data.designer,
        printer: data.printer,
        additionalNotes: data.additionalNotes,
        contentConfirmedOn: data.contentConfirmedOn ? new Date(data.contentConfirmedOn) : null,
        finalDeliveryDate: data.finalDeliveryDate ? new Date(data.finalDeliveryDate) : null,
        assigneeId: data.assigneeId || session.user.id,
      };

      if (data.invoiceNumber) {
        updateData.invoiceNumber = data.invoiceNumber;
      }

      const updatedInvoice = await (tx as any).invoice.update({
        where: { id },
        data: updateData,
      });

      // Update the denormalized fields
      const formattedNumber = `INV-${String(updatedInvoice.invoiceNumber).padStart(4, "0")}`;

      await (tx as any).wIPCard.updateMany({
        where: { invoiceId: id },
        data: { 
          description: data.description, 
          quantity, 
          customerName: data.customerName,
          invoiceNumber: formattedNumber
        },
      });

      await (tx as any).finalCheck.updateMany({
        where: { invoiceId: id },
        data: {
          description: data.description,
          quantity,
          designer: data.designer || null,
          printer: data.printer || null,
          modelNumber: data.modelNumber || "",
          invoiceNumber: formattedNumber
        },
      });

      return updatedInvoice;
    });

    return NextResponse.json({ success: true, data: result });
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
    if (!isValidUUID(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    // Soft delete logic with ORM safety
    await (prisma.invoice as any).update({
      where: { id },
      data: {
        deletedAt: new Date(),
        wipCards: { updateMany: { where: {}, data: { deletedAt: new Date() } } },
        finalCheck: { update: { deletedAt: new Date() } }
      } as any,
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

