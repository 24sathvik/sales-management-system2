import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function requireAuth(role?: "ADMIN" | "USER") {
  const session = await auth();
  if (!session?.user) {
    throw new NextResponse("Unauthorized", { status: 401 });
  }

  if (role && session.user.role !== role) {
    throw new NextResponse("Forbidden", { status: 403 });
  }

  return session.user;
}
