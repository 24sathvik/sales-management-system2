/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { LeaderboardCard, TeamMemberStat } from "./LeaderboardCard";
import { PerformanceCharts } from "./PerformanceCharts";
import { Flame, Info } from "lucide-react";

export function TeamPerformance() {
  const { data: session } = useSession();
  const [data, setData] = useState<TeamMemberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const fetchTeamPerformance = async () => {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          fetch('/api/dashboard/team-performance'),
          fetch('/api/settings/system')
        ]);
        
        const settingsJson = await settingsRes.json();
        if (settingsJson.success) {
          setEnabled(settingsJson.data.enableGamification);
        }

        const json = await statsRes.json();
        if (json.success) setData(json.data);
      } catch (error) {
        console.error("Failed to fetch team performance", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamPerformance();
  }, []);

  const getDynamicHeading = () => {
    const day = new Date().getDate();
    const month = new Date().toLocaleString('default', { month: 'long' });
    const topPerson = data.length > 0 ? data[0].name.split(" ")[0] : "someone";
    const topCount = data.length > 0 ? data[0].invoiceCount : 0;

    if (day <= 10) return `The race is on! Who will lead ${month}?`;
    if (day <= 20) return `Halfway through — ${topPerson} is leading with ${topCount} invoices!`;
    return `Final stretch! ${topPerson} has the lead — can anyone catch up?`;
  };

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[400px] bg-muted rounded-xl col-span-1"></div>
          <div className="h-[400px] bg-muted rounded-xl col-span-2"></div>
        </div>
      </div>
    );
  }

  if (!enabled) return null;
  if (data.length === 0) return null;

  const myData = session?.user?.id ? data.find(d => d.userId === session.user.id) : null;
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <div className="mt-10 pt-8 border-t space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Team Performance
          </h2>
          <p className="text-muted-foreground mt-1">
            {getDynamicHeading()}
          </p>
        </div>

        {myData && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl shadow-sm md:max-w-xs w-full shrink-0">
            <div className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">This is your month, {firstName}! 💪</p>
                <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                  <span>Invoices: <strong className="text-foreground">{myData.invoiceCount}</strong></span>
                  <span>Closed: <strong className="text-foreground">{myData.completionRate.toFixed(0)}%</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LeaderboardCard data={data} />
        <PerformanceCharts teamData={data} />
      </div>
    </div>
  );
}
