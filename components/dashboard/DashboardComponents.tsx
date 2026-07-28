/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, differenceInDays, startOfDay, isTomorrow, isToday } from "date-fns";
import { 
  FileText, TrendingUp, Clock, AlertTriangle, 
  Users, Layers, CheckCircle2, ArrowRight, 
  Calendar, Package, X 
} from "lucide-react";
import { memo, useState } from "react";
import { MetricExplanation } from "@/components/ui/MetricExplanation";

// ─── Stat Card ──────────────────────────────────────────────────────────────
type StatCardProps = { 
  label: string; 
  value: number; 
  icon: any; 
  accentClass: string; 
  subLabel?: string; 
  href?: string;
  isDanger?: boolean;
  explanation?: string;
  delta?: number;
};

export const StatCard = memo(function StatCard({ label, value, icon: Icon, accentClass, subLabel, href, isDanger, explanation, delta }: StatCardProps) {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const content = (
    <div className={`glass-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 flex items-start gap-4 hover:shadow-md transition-all duration-150 h-full ${isDanger && displayValue > 0 ? 'border-l-[3px] border-l-[var(--status-error)]' : ''}`}>
      <div className={`p-2.5 rounded-lg ${accentClass} shrink-0 text-white flex items-center justify-center w-10 h-10`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[32px] leading-tight font-bold text-navy font-syne">{displayValue.toLocaleString()}</div>
        <div className="text-[13px] font-semibold text-text-secondary mt-0.5 flex items-center">
          {label}
          {explanation && <MetricExplanation text={explanation} />}
        </div>
        {(subLabel || delta !== undefined) && (
          <div className="flex items-center gap-2 mt-1">
            {delta !== undefined && (
              <span className={`text-[11px] font-bold flex items-center ${delta > 0 ? (isDanger ? 'text-red-500' : 'text-green-500') : delta < 0 ? (isDanger ? 'text-green-500' : 'text-red-500') : 'text-slate-400'}`}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : '—'} {Math.abs(delta)}%
              </span>
            )}
            {subLabel && <div className="text-[11px] text-slate-400">{subLabel}</div>}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full cursor-pointer">{content}</Link>;
  }
  return content;
});

// ─── Stat Card (Percent Variant with Arc) ───────────────────────────────────
type StatCardPctProps = { label: string; value: number; icon: any; accentClass: string; subLabel?: string; href?: string; explanation?: string; };

export const StatCardPct = memo(function StatCardPct({ label, value, icon: Icon, accentClass, subLabel, href, explanation }: StatCardPctProps) {
  const displayValue = typeof value === 'number' && !isNaN(value) ? value : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const content = (
    <div className={`glass-surface rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-5 flex items-start justify-between hover:shadow-md transition-all duration-150 h-full`}>
      <div className="flex items-start gap-4 flex-1">
        <div className={`p-2.5 rounded-lg ${accentClass} shrink-0 text-white flex items-center justify-center w-10 h-10`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[32px] leading-tight font-bold text-navy font-syne">{displayValue.toFixed(1)}%</div>
          <div className="text-[13px] font-semibold text-text-secondary mt-0.5 flex items-center">
            {label}
            {explanation && <MetricExplanation text={explanation} />}
          </div>
          {subLabel && <div className="text-[11px] text-slate-400 mt-1">{subLabel}</div>}
        </div>
      </div>
      
      {/* Progress Arc */}
      <div className="relative w-12 h-12 shrink-0">
        <svg className="transform -rotate-90 w-12 h-12" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100" />
          <circle 
            cx="24" 
            cy="24" 
            r="18" 
            stroke="currentColor" 
            strokeWidth="3" 
            fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ color: 'var(--brand-primary)' }}
            className="transition-all duration-1000 ease-out" 
          />
        </svg>
      </div>
    </div>
  );
  if (href) return <Link href={href} className="block h-full cursor-pointer">{content}</Link>;
  return content;
});

// ─── Urgent Deliveries Panel ────────────────────────────────────────────────
export const UrgentDeliveriesPanel = memo(function UrgentDeliveriesPanel({ deliveries }: { deliveries: any[] }) {
  const router = useRouter();

  const getDueDateLabel = (dateStr: string) => {
    const date = startOfDay(new Date(dateStr));
    const today = startOfDay(new Date());
    const diff = differenceInDays(date, today);
    
    if (diff < 0) return <span className="text-red-600 font-bold">Overdue — {format(date, "dd MMM")}</span>;
    if (diff === 0) return <span className="text-red-600 font-bold">Today</span>;
    if (diff === 1) return <span className="text-amber-500 font-bold">Tomorrow</span>;
    return <span className="text-slate-600 font-medium">{format(date, "dd MMM")}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-syne text-slate-800 flex items-center gap-2">
            🔴 Urgent Deliveries
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Due within 48 hours</p>
        </div>
        <Link
          href="/dashboard/invoices?filter=overdue"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          View All Invoices <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!deliveries || deliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mb-2 opacity-80" />
          <p className="text-sm font-medium text-slate-600">All clear! No urgent deliveries.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Invoice</th>
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Customer</th>
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Due Date</th>
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Assignee</th>
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50 cursor-pointer transition-colors border-b last:border-0" onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}>
                  <td className="py-2.5 pr-4">
                    <span className="font-bold text-navy font-mono text-xs">INV-{String(inv.invoiceNumber).padStart(4, "0")}</span>
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-slate-700 truncate max-w-[120px]">{inv.customerName}</td>
                  <td className="py-2.5 pr-4 text-xs">
                    {inv.finalDeliveryDate ? getDueDateLabel(inv.finalDeliveryDate) : "—"}
                  </td>
                  <td className="py-2.5 text-slate-600 text-xs">{inv.assignee?.name || "—"}</td>
                  <td className="py-2.5 text-slate-600 text-xs">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ─── WIP Pipeline Mini Summary ──────────────────────────────────────────────
const PHASE_LABELS: Record<string, string> = {
  RAW_MATERIALS: "RAW MATERIALS",
  DESIGN: "DESIGN",
  PRINTING: "PRINTING",
  POST_PRINTING: "POST PRINTING",
  PAYMENT_PENDING: "PAYMENT"
};

export const WIPSummaryBar = memo(function WIPSummaryBar({ phases, total }: { phases: Array<{ id: string, name: string, color: string, count: number }>; total: number }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
        {phases.map((phase) => (
            <div key={phase.id} className="flex flex-col items-center">
              <div className="text-2xl font-bold text-navy font-syne mb-1">{phase.count}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center h-6 leading-tight">{phase.name}</div>
            </div>
        ))}
      </div>

      {total > 0 ? (
        <div className="flex h-2 rounded-full overflow-hidden w-full">
          {phases.map((phase) => {
            const pct = (phase.count / total) * 100;
            if (pct === 0) return null;
            return <div key={phase.id} className="transition-all" style={{ width: `${pct}%`, backgroundColor: phase.color || '#C77D2E' }} />;
          })}
        </div>
      ) : (
        <div className="h-2 rounded-full bg-slate-100 w-full" />
      )}
      
      <div className="text-[11px] text-slate-400 mt-3 text-center">
        {total} total items in production
      </div>
    </div>
  );
});

// ─── Recent Invoices Table ───────────────────────────────────────────────────
export const RecentInvoicesTable = memo(function RecentInvoicesTable({ invoices }: { invoices: any[] }) {
  if (!invoices?.length) {
    return <p className="text-sm text-slate-500 py-4">No recent invoices.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {["Invoice No", "Customer", "Amount", "Delivery", "Stage", "Status"].map(h => (
              <th key={h} className={`pb-2 font-semibold text-slate-500 text-xs uppercase tracking-wide ${h === "Amount" ? "text-right" : "text-left"} pr-4`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-slate-50 transition-colors border-b last:border-0">
              <td className="py-3 pr-4">
                <Link href={`/dashboard/invoices/${inv.id}`} className="font-bold text-navy text-xs font-mono hover:underline">
                  INV-{String(inv.invoiceNumber).padStart(4, "0")}
                </Link>
              </td>
              <td className="py-3 pr-4 font-medium text-slate-700 max-w-[140px] truncate">{inv.customerName}</td>
              <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-800 text-right">
                ₹{Number(inv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td className="py-3 pr-4 text-xs font-medium text-slate-600">
                {inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM yy") : "—"}
              </td>
              <td className="py-3 pr-4">
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                  {inv.category || "General"}
                </span>
              </td>
              <td className="py-3">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${inv.status === 'CLOSED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ─── Recent Quotations Card ───────────────────────────────────────────────────
export const RecentQuotationsCard = memo(function RecentQuotationsCard({ quotations }: { quotations: any[] }) {
  if (!quotations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-3 h-full">
        <Link href="/dashboard/quotations/new" className="text-xs px-4 py-2 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark transition-colors">
          + Create Quotation
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {["Quotation", "Customer", "Amount", "Valid Until", "Status"].map(h => (
              <th key={h} className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide pr-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {quotations.map((q: any) => {
            const isRejected = q.status === 'rejected';
            const isValidDate = q.valid_until ? new Date(q.valid_until) : null;
            const diffDays = isValidDate ? differenceInDays(startOfDay(isValidDate), startOfDay(new Date())) : null;
            
            let validClass = "text-slate-500";
            if (q.status !== 'accepted' && q.status !== 'rejected') {
               if (diffDays !== null && diffDays < 0) validClass = "text-red-500 font-bold";
               else if (diffDays !== null && diffDays <= 3) validClass = "text-amber-500 font-bold";
            }

            return (
              <tr key={q.id} className={`hover:bg-slate-50 transition-colors border-b last:border-0 ${isRejected ? 'opacity-60' : ''}`}>
                <td className="py-2.5 pr-3">
                  <Link href={`/dashboard/quotations/${q.id}`} className="font-bold text-navy text-xs font-mono hover:underline">
                    {q.quotation_number || "Draft"}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 font-medium text-slate-700 max-w-[100px] truncate">{q.customer_name}</td>
                <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-slate-800">
                  ₹{Number(q.total_amount).toLocaleString("en-IN")}
                </td>
                <td className={`py-2.5 pr-3 text-xs ${validClass}`}>
                  {isValidDate ? format(isValidDate, "dd MMM yy") : "—"}
                </td>
                <td className="py-2.5">
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(q.status)}`}>
                    {q.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

// ─── Financial Snapshot Widget ────────────────────────────────────────────────
export const FinancialSnapshotWidget = memo(function FinancialSnapshotWidget({ data }: { data: any }) {
  return (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
          <span className="text-sm font-medium text-slate-500 flex items-center">
            Gross Revenue
            <MetricExplanation text={`Gross Revenue (₹${data.grossRevenue.toLocaleString("en-IN")}) = Sum of all closed invoices in this period.`} />
          </span>
          <span className="text-sm font-bold text-green-600 font-mono">₹{data.grossRevenue.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-dashed border-slate-200">
          <span className="text-sm font-medium text-slate-500 flex items-center">
            Production Costs
            <MetricExplanation text={`Production Costs (₹${data.productionCosts.toLocaleString("en-IN")}) = Sum of all purchase costs for closed invoices.`} />
          </span>
          <span className="text-sm font-bold text-red-600 font-mono">- ₹{data.productionCosts.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-[15px] font-extrabold text-navy flex items-center">
            Net Profit
            <MetricExplanation text={`Net Profit (₹${data.netProfit.toLocaleString("en-IN")}) = Gross Revenue - Production Costs`} />
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex px-2 py-0.5 rounded bg-gold/10 text-gold font-bold text-xs">
              {data.profitMargin}% Margin
            </span>
            <span className="text-[15px] font-extrabold text-navy font-mono">₹{data.netProfit.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const FinalCheckStatus = memo(function FinalCheckStatus({ pending, completedThisMonth }: { pending: number; completedThisMonth: number }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)]">
        <Clock className="w-8 h-8 text-amber-600 shrink-0" />
        <div>
          <div className="text-2xl font-extrabold text-amber-700 font-syne">{pending}</div>
          <div className="text-sm font-medium text-amber-600">Pending Final Checks</div>
        </div>
      </div>
      <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-[var(--radius-lg)]">
        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
        <div>
          <div className="text-2xl font-extrabold text-green-700 font-syne">{completedThisMonth}</div>
          <div className="text-sm font-medium text-green-600">Completed This Month</div>
        </div>
      </div>
      <Link
        href="/dashboard/final-check"
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline mt-2"
      >
        Open Final Check <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
});

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 h-[106px]">
            <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 w-16 bg-slate-200 rounded"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 h-[280px]"></div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[280px]"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 h-[380px]"></div>
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[220px]"></div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 h-[140px]"></div>
        </div>
      </div>
    </div>
  );
}

export { FileText, TrendingUp, Clock, AlertTriangle, Users, Layers, Calendar, Package };

