import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: LucideIcon;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  actionIcon: ActionIcon,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`w-full flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-300 rounded-xl ${compact ? 'p-8' : 'p-16 py-24'} animate-in fade-in`}>
      <div className={`bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4 shadow-sm border ${compact ? 'w-12 h-12' : 'w-16 h-16'}`}>
        <Icon className={compact ? "w-6 h-6" : "w-8 h-8"} />
      </div>
      <h3 className={`font-display font-bold text-slate-800 ${compact ? 'text-lg' : 'text-xl'} mb-2`}>
        {title}
      </h3>
      <p className={`text-slate-500 max-w-sm mb-6 ${compact ? 'text-xs' : 'text-sm'}`}>
        {description}
      </p>
      
      {actionLabel && actionHref && (
        <Link 
          href={actionHref}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-6 rounded-lg transition-all active:scale-95 shadow-md shadow-primary/20"
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
