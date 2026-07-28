"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, AlertCircle, Info, RefreshCw, TrendingUp } from "lucide-react";
import { Insight } from "@/lib/insights/rules";

export function InsightsPanel() {
  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: Insight[] }>({
    queryKey: ["business-insights"],
    queryFn: async () => {
      const res = await fetch("/api/insights");
      if (!res.ok) throw new Error("Failed to fetch insights");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="h-full flex flex-col shadow-sm rounded-xl border bg-white tour-insights">
      <div className="pb-3 border-b border-border/50 flex flex-row items-center justify-between p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          Business Insights
        </h3>
        <button
          onClick={() => refetch()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh Insights"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-muted/20">
        {isLoading && <div className="text-sm text-muted-foreground animate-pulse">Analyzing business data...</div>}
        {error && <div className="text-sm text-destructive">Failed to load insights.</div>}
        
        {data?.success && data.data.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            Everything looks good! No critical issues found.
          </div>
        )}

        {data?.success && data.data.map((insight, idx) => {
          let Icon = Info;
          let colorClass = "text-indigo-600";
          let bgClass = "bg-indigo-50 border-indigo-100";

          let isProjection = false;

          if (insight.severity === "critical") {
            Icon = AlertTriangle;
            colorClass = "text-red-600";
            bgClass = "bg-red-50 border-red-100";
          } else if (insight.severity === "warning") {
            Icon = AlertCircle;
            colorClass = "text-amber-600";
            bgClass = "bg-amber-50 border-amber-100";
          } else if (insight.title.includes("Projected") || insight.title.includes("Projection")) {
            // Projection distinct UI
            Icon = TrendingUp;
            colorClass = "text-blue-600";
            bgClass = "bg-blue-50 border-blue-100";
            isProjection = true;
          }

          return (
            <div key={idx} className={`p-3 rounded-md border ${bgClass} flex items-start gap-3 relative overflow-hidden group`}>
              {isProjection && <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>}
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${colorClass} relative z-10`} />
              <div className="relative z-10">
                <h4 className={`text-sm font-semibold ${colorClass}`}>{insight.title}</h4>
                <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                  {insight.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
