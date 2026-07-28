export const dynamic = "force-dynamic";
// SECURITY CHECKLIST:
// - [x] Authentication (NextAuth auth())
// - [x] Role-Based Access Control (requireRole ADMIN)
// - [x] Input Validation (Zod safeParse)
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
import { hash } from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  password: z.string().min(6).optional(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    requireRole(session, "ADMIN");
    const rateLimitResponse = await checkRateLimit(req, session?.user?.id || null, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = params;
    if (!isValidUUID(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, role, password } = parsed.data;
    
    // Check if this is a password reset or a regular update
    if (password) {
      const hashedPassword = await hash(password, 12);
      const user = await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
        select: { id: true, name: true, email: true, role: true },
      });
      return NextResponse.json({ success: true, data: user });
    } else {
      const user = await prisma.user.update({
        where: { id },
        data: { name, role },
        select: { id: true, name: true, email: true, role: true },
      });
      return NextResponse.json({ success: true, data: user });
    }
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

    if (session?.user?.id === id) {
      return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
