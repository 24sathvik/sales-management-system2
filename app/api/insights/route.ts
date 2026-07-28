import { NextResponse } from "next/server";
import { fetchAIContext } from "@/lib/actions/ai-context";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { rules, Insight } from "@/lib/insights/rules";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 50);
    if (rateLimitResponse) return rateLimitResponse;

    // Fetch the corrected context
    const context = await fetchAIContext();

    // Run rules engine
    const insights: Insight[] = [];
    for (const rule of rules) {
      const result = rule.evaluate(context);
      if (result) {
        insights.push(result);
      }
    }

    // Sort by severity: critical > warning > info
    const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 };
    insights.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    return NextResponse.json({ success: true, data: insights }, {
      headers: {
        "Cache-Control": "private, max-age=300" // 5 minutes low-stakes staleness
      }
    });
  } catch (error) {
    console.error("Insights API error:", error);
    return NextResponse.json({ success: false, error: 'Failed to fetch insights' }, { status: 500 });
  }
}
