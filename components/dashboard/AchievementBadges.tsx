/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { Trophy, Star, Target, Zap, Flame, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  type: string;
  className?: string;
  showLabel?: boolean;
}

const BADGE_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string; desc: string }> = {
  "Top Closer": {
    icon: Trophy,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    label: "Top Closer",
    desc: "Most closed invoices this month"
  },
  "Revenue King/Queen": {
    icon: Crown,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    label: "Revenue King/Queen",
    desc: "Highest revenue this month"
  },
  "Speed Demon": {
    icon: Zap,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    label: "Speed Demon",
    desc: "Fastest average time to completion"
  },
  "On Target": {
    icon: Target,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    label: "On Target",
    desc: "No overdue deliveries this month"
  },
  "On a Streak": {
    icon: Flame,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    label: "On a Streak",
    desc: "Created invoices on 5 distinct days this week"
  },
  "First Invoice": {
    icon: Star,
    color: "text-pink-600",
    bg: "bg-pink-100 dark:bg-pink-900/30",
    label: "First Invoice",
    desc: "Achieved the first invoice milestone"
  }
};

export function AchievementBadge({ type, className, showLabel = false }: BadgeProps) {
  const config = BADGE_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      title={`${config.label} - ${config.desc}`}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm ring-1 ring-inset ring-black/5 cursor-default transition-transform hover:scale-110",
        config.bg,
        config.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

export function BadgeRow({ badges, className }: { badges: string[], className?: string }) {
  if (!badges || badges.length === 0) return null;
  
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {badges.map(b => (
        <AchievementBadge key={b} type={b} />
      ))}
    </div>
  );
}

