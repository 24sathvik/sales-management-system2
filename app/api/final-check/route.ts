export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A)
// - [x] Input Validation (Zod safeParse)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const finalCheckCreateSchema = z.object({
  wipCardId: z.string().uuid()
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const finalChecks = await prisma.finalCheck.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            customerName: true,
            wipCards: { include: { checklistResponses: { include: { item: true } } } }
          }
        }
      }
    });

    const aggregated = finalChecks.map((fc: any) => {
      const responses = fc.invoice?.wipCards?.flatMap((wip: any) => wip.checklistResponses || []) || [];
      const mergedChecklists = responses.reduce((acc: Record<string, boolean>, r: any) => {
        acc[r.itemId] = r.isChecked;
        if (r.item?.key) acc[r.item.key] = r.isChecked; // fallback for legacy keys if needed
        return acc;
      }, {});
      
      return { ...fc, ...mergedChecklists, responses };
    });

    return NextResponse.json({ success: true, data: aggregated });
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
    const parsed = finalCheckCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { wipCardId } = parsed.data;

    const wipCard = await (prisma as any).wIPCard.findUnique({
      where: { id: wipCardId },
      include: { invoice: true, stage: true }
    });

    if (!wipCard) {
      return NextResponse.json({ success: false, error: 'WIP Card not found' }, { status: 404 });
    }

    if (wipCard.stageId) {
      const activeTemplate = await prisma.checklistTemplate.findFirst({
        where: { stageId: wipCard.stageId, isActive: true },
        include: { items: { where: { isRequired: true } } }
      });
      
      if (activeTemplate && activeTemplate.items.length > 0) {
        const responses = await prisma.checklistResponse.findMany({
          where: { wipCardId, itemId: { in: activeTemplate.items.map(i => i.id) }, isChecked: true }
        });
        
        const checkedItemIds = new Set(responses.map(r => r.itemId));
        const missingFields = activeTemplate.items.filter(item => !checkedItemIds.has(item.id));
        
        if (missingFields.length > 0) {
          const stageName = wipCard.stage?.name || "Current Stage";
          return NextResponse.json({ 
            success: false, 
            error: `Cannot archive to Final Check. The following checklist items in ${stageName} are incomplete: ${missingFields.map(m => m.label).join(", ")}` 
          }, { status: 400 });
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update existing FinalCheck record tied to the invoice
      const finalCheck = await (tx as any).finalCheck.update({
        where: { invoiceId: wipCard.invoiceId },
        data: {
          invoiceNumber: wipCard.invoiceNumber,
          description: wipCard.description,
          quantity: wipCard.quantity,
          modelNumber: wipCard.invoice.modelNumber || "",
          designer: wipCard.invoice.designer || null,
          printer: wipCard.invoice.printer || null,
        }
      });

      // Archive the original WIPCard by setting deletedAt securely so it drops off the board
      await (tx as any).wIPCard.update({
        where: { id: wipCardId },
        data: { deletedAt: new Date() }
      });

      return finalCheck;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
