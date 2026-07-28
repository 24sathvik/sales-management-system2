"use client";

import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ErrorState } from "@/components/ui/ErrorState";
import { KanbanSkeleton } from "@/components/ui/skeletons/KanbanSkeleton";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const KanbanBoard = dynamic(
  () => import("@/components/wip/KanbanBoard").then(m => ({ default: m.KanbanBoard })),
  { ssr: false, loading: () => <KanbanSkeleton /> }
);

export default function WorkInProgressPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("wip_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "WIPCard" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wip"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "WIPChecklist" }, () => {
        queryClient.invalidateQueries({ queryKey: ["wip"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: columnsData, isLoading, isError, refetch } = useQuery({
    queryKey: ["wip"],
    queryFn: async () => {
      const res = await fetch("/api/wip");
      if (!res.ok) throw new Error("Failed to load Kanban board");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 10000,
    refetchInterval: 15000,
  });

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Work in Progress</h1>
        <p className="text-sm text-slate-500 mt-1">Drag and drop production cards through the pipeline.</p>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <KanbanSkeleton />
        ) : isError ? (
          <ErrorState message="Failed to load the Kanban board." onRetry={() => refetch()} />
        ) : (
          columnsData && <KanbanBoard initialData={columnsData} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
