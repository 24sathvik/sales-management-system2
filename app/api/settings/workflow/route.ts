export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

import { z } from "zod";

const createStageSchema = z.object({
  name: z.string().min(1),
  color: z.string().default("#C77D2E"),
  icon: z.string().optional(),
  order: z.number().int()
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    requireRole(session, "ADMIN");

    const stages = await prisma.workflowStage.findMany({
      orderBy: { order: 'asc' },
      include: {
        checklistTemplate: {
          include: {
            items: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, data: stages });
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
    requireRole(session, "ADMIN");

    const body = await req.json();
    const parsed = createStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const stage = await prisma.workflowStage.create({
      data: {
        name: parsed.data.name,
        color: parsed.data.color,
        icon: parsed.data.icon,
        order: parsed.data.order,
        checklistTemplate: {
          create: {
            name: `${parsed.data.name} Checklist`,
            isActive: true
          }
        }
      },
      include: {
        checklistTemplate: {
          include: { items: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: stage });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
