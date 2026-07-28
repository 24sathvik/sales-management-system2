export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse inline)
// - [x] UUID Validation
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const wipUpdateSchema = z.object({
  stageId: z.string().optional(),
  order: z.number().int().optional(),
  version: z.number().int()
});

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
    const parsed = wipUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { stageId, order, version } = parsed.data;

    // DB Query uses Prisma ORM which automatically parameterizes inputs
    const existingCard = await (prisma as any).wIPCard.findUnique({
      where: { id },
      select: { invoiceId: true, stageId: true, stage: true }
    });

    if (!existingCard) {
      return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });
    }

    if (stageId && stageId !== existingCard.stageId) {
      const activeTemplate = await prisma.checklistTemplate.findFirst({
        where: { stageId: existingCard.stageId, isActive: true },
        include: { items: { where: { isRequired: true } } }
      });
      
      if (activeTemplate && activeTemplate.items.length > 0) {
        const responses = await prisma.checklistResponse.findMany({
          where: { wipCardId: id, itemId: { in: activeTemplate.items.map(i => i.id) }, isChecked: true }
        });
        
        const checkedItemIds = new Set(responses.map(r => r.itemId));
        const missingFields = activeTemplate.items.filter(item => !checkedItemIds.has(item.id));
        
        if (missingFields.length > 0) {
          const stageName = existingCard.stage?.name || "Current Stage";
          return NextResponse.json({ 
            success: false, 
            error: `Cannot change stage. The following checklist items in ${stageName} are incomplete: ${missingFields.map(m => m.label).join(", ")}` 
          }, { status: 400 });
        }
      }
    }

    const updateResult = await (prisma as any).wIPCard.updateMany({
      where: { id, version },
      data: { stageId, order, version: { increment: 1 } },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'This card was updated by someone else. Please refresh.' 
      }, { status: 409 });
    }

    const updated = await (prisma as any).wIPCard.findUnique({ where: { id } });

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

    await (prisma as any).wIPCard.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
