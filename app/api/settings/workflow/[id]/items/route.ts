export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isValidUUID } from "@/lib/utils";

const itemsSyncSchema = z.array(z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  isRequired: z.boolean(),
  order: z.number().int()
}));

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    requireRole(session, "ADMIN");

    const stageId = params.id;
    if (!isValidUUID(stageId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = itemsSyncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const incomingItems = parsed.data;

    let template = await prisma.checklistTemplate.findUnique({
      where: { stageId }
    });

    if (!template) {
      const stage = await prisma.workflowStage.findUnique({ where: { id: stageId } });
      if (!stage) {
        return NextResponse.json({ success: false, error: 'Workflow stage not found' }, { status: 404 });
      }
      template = await prisma.checklistTemplate.create({
        data: {
          stageId,
          name: `${stage.name} Checklist`,
          isActive: true
        }
      });
    }

    const templateId = template.id;

    // Sync logic using transaction
    const result = await prisma.$transaction(async (tx) => {
      const existingItems = await tx.checklistItem.findMany({
        where: { templateId }
      });

      const incomingIds = incomingItems.filter(i => i.id).map(i => i.id);
      const toDelete = existingItems.filter(e => !incomingIds.includes(e.id)).map(e => e.id);

      if (toDelete.length > 0) {
        await tx.checklistItem.deleteMany({
          where: { id: { in: toDelete } }
        });
      }

      for (const item of incomingItems) {
        if (item.id) {
          // Update
          await tx.checklistItem.update({
            where: { id: item.id },
            data: { label: item.label, isRequired: item.isRequired, order: item.order }
          });
        } else {
          // Create
          await tx.checklistItem.create({
            data: {
              templateId,
              label: item.label,
              isRequired: item.isRequired,
              order: item.order
            }
          });
        }
      }

      return tx.checklistItem.findMany({
        where: { templateId },
        orderBy: { order: 'asc' }
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
