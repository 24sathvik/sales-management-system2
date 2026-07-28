export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { isValidUUID } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    const card = await prisma.wIPCard.findUnique({
      where: { id },
      select: { stageId: true, invoiceId: true }
    });

    if (!card) return NextResponse.json({ success: false, error: 'Card not found' }, { status: 404 });

    const template = await prisma.checklistTemplate.findFirst({
      where: { stageId: card.stageId, isActive: true },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!template) {
      return NextResponse.json({ success: true, data: null });
    }

    const responses = await prisma.checklistResponse.findMany({
      where: { wipCardId: id }
    });

    return NextResponse.json({ success: true, data: { template, responses } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

const updateSchema = z.object({
  itemId: z.string().uuid(),
  isChecked: z.boolean()
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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { itemId, isChecked } = parsed.data;

    const existing = await prisma.checklistResponse.findFirst({
      where: { wipCardId: id, itemId }
    });

    let result;
    if (existing) {
      result = await prisma.checklistResponse.update({
        where: { id: existing.id },
        data: { isChecked, checkedAt: isChecked ? new Date() : null, checkedBy: session.user.id }
      });
    } else {
      result = await prisma.checklistResponse.create({
        data: {
          wipCardId: id,
          itemId,
          isChecked,
          checkedAt: isChecked ? new Date() : null,
          checkedBy: session.user.id
        }
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
