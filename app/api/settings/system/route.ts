import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: "default", enableGamification: true }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { enableGamification } = await request.json();

    const settings = await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { enableGamification },
      create: { id: "default", enableGamification },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Failed to update system settings:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
