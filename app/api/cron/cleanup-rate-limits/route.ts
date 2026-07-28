import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
       return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.rateLimit.deleteMany({
      where: {
        windowStart: {
          lt: twentyFourHoursAgo
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
