export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole for DELETE)
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
    
    // allow partial updates of any fields securely via ORM
    const standardFields: Record<string, any> = {};
    const checklistFields: Record<string, boolean> = {};

    for (const [key, value] of Object.entries(body)) {
      if (key.match(/^(rm|d|p|pp|pay)_/)) {
        checklistFields[key] = value as boolean;
      } else {
        standardFields[key] = value;
      }
    }

    const updated = await (prisma.finalCheck as any).update({
      where: { id },
      data: standardFields,
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            customerName: true,
          }
        }
      }
    });

    if (Object.keys(checklistFields).length > 0) {
      for (const [key, value] of Object.entries(checklistFields)) {
        // if key is a valid UUID, it's an itemId. Else, find by key.
        let itemId = key;
        if (!isValidUUID(key)) {
          const item = await prisma.checklistItem.findFirst({ where: { key } });
          if (item) itemId = item.id;
        }

        if (isValidUUID(itemId)) {
          const existing = await prisma.checklistResponse.findFirst({
            where: { finalCheckId: id, itemId }
          });

          if (existing) {
            await prisma.checklistResponse.update({
              where: { id: existing.id },
              data: { isChecked: value, checkedAt: value ? new Date() : null, checkedBy: session.user.id }
            });
          } else {
            await prisma.checklistResponse.create({
              data: {
                finalCheckId: id,
                itemId,
                isChecked: value,
                checkedAt: value ? new Date() : null,
                checkedBy: session.user.id
              }
            });
          }
        }
      }
    }

    // Trigger invoice status = CLOSED and auto-create Purchase record
    if (body.isComplete) {
       await (prisma.invoice as any).update({
         where: { id: updated.invoiceId },
         data: { status: "CLOSED" }
       });

       // Auto-create Purchase record (idempotent - ignores if already exists)
       try {
         const invoice = await (prisma as any).invoice.findUnique({ where: { id: updated.invoiceId } });
         if (invoice) {
           const existingPurchase = await (prisma as any).purchase.findUnique({ where: { invoiceId: updated.invoiceId } });
           if (!existingPurchase) {
             await (prisma as any).purchase.create({
               data: {
                 invoiceId: updated.invoiceId,
                 invoiceNumber: `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`,
                 customerName: invoice.customerName,
                 description: invoice.description,
                 category: invoice.category || "Uncategorized",
                 quantity: invoice.quantity,
                 billValue: invoice.totalAmount,
                 completedAt: new Date(),
               }
             });
           }
         }
       } catch (e) {
         console.error("Purchase auto-create error:", e);
       }
    }

    return NextResponse.json({ success: true, data: updated });
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

    await (prisma.finalCheck as any).update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
