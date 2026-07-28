export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (N/A - basic auth is fine)
// - [x] Input Validation (N/A - no payload)
// - [x] SQL Injection protection (Prisma ORM)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;
    
    // DB Query uses Prisma ORM which intrinsically prevents SQL injection
    // Fetch all active WorkflowStages
    const stages = await prisma.workflowStage.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" }
    });

    // Fetch all active WIPCards
    const rawWipCards = await (prisma as any).wIPCard.findMany({
      where: { deletedAt: null },
      orderBy: { order: "asc" },
      include: {
        invoice: {
          select: {
            finalDeliveryDate: true,
            status: true,
            assignee: { select: { id: true, name: true } },
          }
        },
        stage: true
      }
    });

    const columns: Record<string, any[]> = {};
    stages.forEach(s => {
      columns[s.id] = [];
    });

    // We might have legacy cards without a valid stage, put them in the first column as fallback
    const fallbackStageId = stages.length > 0 ? stages[0].id : "UNKNOWN";
    if (!columns[fallbackStageId]) columns[fallbackStageId] = [];

    rawWipCards.forEach((card: any) => {
      const stageId = card.stageId || fallbackStageId;
      if (columns[stageId]) {
        columns[stageId].push(card);
      } else {
        // If stage is deleted but card exists, push to fallback
        columns[fallbackStageId].push(card);
      }
    });

    return NextResponse.json({ success: true, data: { stages, columns } });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
