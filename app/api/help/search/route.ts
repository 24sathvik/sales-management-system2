export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import Fuse from "fuse.js";
import { faqData } from "@/lib/help/faq";
import { auth } from "@/lib/auth";

// Cheap, static, local computation with no external cost, so skipping rate limit
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ success: true, data: faqData.slice(0, 4) });
    }

    const fuse = new Fuse(faqData, {
      keys: ["question", "keywords"],
      threshold: 0.4,
    });

    const results = fuse.search(query).slice(0, 5).map(result => result.item);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ success: false, error: 'Failed to search FAQ' }, { status: 500 });
  }
}
