import { NextResponse } from "next/server";
import { prisma } from "./prisma";

export async function checkRateLimit(req: Request, identifier: string | null, limit: number, windowMs: number = 60000) {
  if (!identifier) {
    identifier = req.headers.get("x-forwarded-for") || "unknown-ip";
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname;
    const key = `${action}:${identifier}`;
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));

    // We do an atomic UPSERT.
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimit" (key, count, "windowStart")
      VALUES (${key}, 1, now())
      ON CONFLICT (key) DO UPDATE
      SET 
        count = CASE 
          WHEN "RateLimit"."windowStart" < now() - interval '1 second' * ${windowSeconds} THEN 1
          ELSE "RateLimit".count + 1
        END,
        "windowStart" = CASE 
          WHEN "RateLimit"."windowStart" < now() - interval '1 second' * ${windowSeconds} THEN now()
          ELSE "RateLimit"."windowStart"
        END
      RETURNING count;
    `;

    const currentCount = result[0]?.count || 1;

    if (currentCount > limit) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }
    
    return null;
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fall open if DB fails
    return null;
  }
}
