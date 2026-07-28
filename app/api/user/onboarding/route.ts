import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Wrap in try-catch in case migration hasn't run in production yet
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasSeenOnboarding: true }
      });
    } catch (dbError) {
      console.warn("Could not update hasSeenOnboarding in DB, falling back to local state.", dbError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding update error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
