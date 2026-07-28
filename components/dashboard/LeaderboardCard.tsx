"use client";

import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Medal, AlertCircle } from "lucide-react";
import { BadgeRow } from "./AchievementBadges";

export interface TeamMemberStat {
  userId: string;
  name: string;
  invoiceCount: number;
  revenue: number;
  avgInvoiceValue: number;
  completionRate: number;
  badges: string[];
}

export function LeaderboardCard({ data }: { data: TeamMemberStat[] }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  if (!data || data.length === 0) {
    return (
      <div className="col-span-full bg-white rounded-xl border shadow-sm">
        <div className="p-6 py-10 text-center text-muted-foreground flex flex-col items-center">
          <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
          <p>No team data available for this month.</p>
        </div>
      </div>
    );
  }

  // Top 3
  const top3 = data.slice(0, 3);
  // Remaining
  const rest = data.slice(3);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-md" />;
    if (index === 1) return <Medal className="h-7 w-7 text-slate-400 drop-shadow-md" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-700 drop-shadow-md" />;
    return null;
  };

  return (
    <div className="col-span-1 rounded-xl shadow-sm bg-gradient-to-br from-background to-secondary/10 border border-primary/20">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> 
          Top Performers
        </h3>
      </div>
      <div className="p-6 pt-0">
        {/* Podium Area */}
        <div className="flex flex-col gap-4 mb-6">
          {top3.map((user, idx) => {
            const isMe = user.userId === currentUserId;
            return (
              <div 
                key={user.userId} 
                className={`relative flex items-center justify-between p-4 rounded-xl border ${
                  isMe ? "bg-primary/5 border-primary shadow-sm" : "bg-card border-border hover:bg-slate-50"
                } transition-all overflow-hidden group`}
              >
                {/* Decorative rank background */}
                <div className="absolute -left-4 -top-4 text-9xl font-black text-slate-200/50 opacity-30 select-none z-0 group-hover:opacity-50 transition-opacity">
                  {idx + 1}
                </div>
                
                <div className="flex items-center gap-4 z-10 w-full">
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    {getMedalIcon(idx)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                      {user.name} {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>}
                    </p>
                    <BadgeRow badges={user.badges} className="mt-1" />
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-primary">{formatCurrency(user.revenue)}</p>
                    <p className="text-xs text-slate-500">{user.invoiceCount} invoices ({user.completionRate.toFixed(0)}% closed)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of the team list */}
        {rest.length > 0 && (
          <div className="space-y-3 mt-6 pt-4 border-t">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team Roster</h4>
            {rest.map((user, idx) => {
              const isMe = user.userId === currentUserId;
              return (
                <div 
                  key={user.userId} 
                  className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                    isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="font-mono text-slate-500 text-xs w-4 text-right">{idx + 4}.</span>
                    <span className="font-medium truncate">{user.name}</span>
                    {isMe && <span className="hidden sm:inline-block text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">You</span>}
                    <BadgeRow badges={user.badges} />
                  </div>
                  <div className="text-right flex-shrink-0 tabular-nums">
                    <span className="font-semibold">{formatCurrency(user.revenue)}</span>
                    <span className="text-slate-500 text-xs ml-2 w-12 inline-block text-right">({user.invoiceCount})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
