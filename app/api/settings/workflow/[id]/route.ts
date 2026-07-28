export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { isValidUUID } from "@/lib/utils";

const stageUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    requireRole(session, "ADMIN");

    const templateId = params.id;
    if (!isValidUUID(templateId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = stageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, color, icon, order, isActive } = parsed.data;

    // Update the WorkflowStage
    const updatedStage = await prisma.workflowStage.update({
      where: { id: templateId },
      data: { name, color, icon, order, isActive },
      include: {
        checklistTemplate: {
          include: { items: { orderBy: { order: 'asc' } } }
        }
      }
    });

    // Also update the checklist template name if stage name changed
    if (name && updatedStage.checklistTemplate) {
      await prisma.checklistTemplate.update({
        where: { id: updatedStage.checklistTemplate.id },
        data: { name: `${name} Checklist`, isActive: isActive ?? updatedStage.checklistTemplate.isActive }
      });
      updatedStage.checklistTemplate.name = `${name} Checklist`;
      if (isActive !== undefined) updatedStage.checklistTemplate.isActive = isActive;
    }

    return NextResponse.json({ success: true, data: updatedStage });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
