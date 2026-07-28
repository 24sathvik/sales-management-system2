/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
const TeamPerformance = dynamic(() => import("@/components/dashboard/TeamPerformance").then(mod => mod.TeamPerformance), { ssr: false });
const AdminAnalytics = dynamic(() => import("@/components/dashboard/AdminAnalytics").then(mod => mod.AdminAnalytics), { ssr: false });
import { InsightsPanel } from "@/components/insights/InsightsPanel";
import {
  StatCard,
  StatCardPct,
  UrgentDeliveriesPanel,
  WIPSummaryBar,
  RecentInvoicesTable,
  RecentQuotationsCard,
  FinalCheckStatus,
  DashboardSkeleton,
} from "@/components/dashboard/DashboardComponents";
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RefreshButton } from "@/components/dashboard/RefreshButton";

import { Download } from "lucide-react";
import { DashboardFilter, DateRange } from "@/components/dashboard/DashboardFilter";
import { PageTour } from "@/components/onboarding/PageTour";

export default function DashboardClient({ initialStats, initialQuotations, initialQuotationStats }: any) {
  const { data: session } = useSession();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStart,
    endDate: defaultEnd,
  });

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-stats", dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    initialData: (dateRange.startDate === defaultStart && dateRange.endDate === defaultEnd) ? initialStats : undefined,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // Fetch quotations separately from Supabase
  const { data: quotationsData } = useQuery({
    queryKey: ["dashboard-quotations", session?.user?.id],
    queryFn: async () => {
      let query = supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (session?.user?.role !== "ADMIN" && session?.user?.id) {
        query = query.eq("created_by", session.user.id);
      }
      
      const { data: quotations } = await query;
      return quotations || [];
    },
    initialData: initialQuotations,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: quotationStats } = useQuery({
    queryKey: ["dashboard-quotation-stats", currentMonth, session?.user?.id],
    queryFn: async () => {
      const startOfMonth = `${currentMonth}-01`;
      let query = supabase
        .from("quotations")
        .select("status, created_at")
        .gte("created_at", startOfMonth);

      if (session?.user?.role !== "ADMIN" && session?.user?.id) {
        query = query.eq("created_by", session.user.id);
      }

      const { data: allQuotations } = await query;

      const all = allQuotations || [];
      const total = all.length;
      const sent = all.filter((q) => q.status === "sent").length;
      const accepted = all.filter((q) => q.status === "accepted").length;
      const conversionRate =
        total > 0 ? ((accepted / total) * 100).toFixed(1) : "0.0";
      return { total, sent, conversionRate };
    },
    initialData: initialQuotationStats,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-150 tour-dashboard">
      <PageTour 
        tourId="dashboard"
        steps={[
          {
            element: '.tour-dashboard',
            popover: {
              title: 'Welcome to your Dashboard',
              description: 'This is your operational command center. Let’s take a quick look at what everything means.',
              side: "bottom",
              align: 'start'
            }
          },
          {
            element: '.stat-urgent',
            popover: {
              title: 'Urgent Deliveries',
              description: 'Orders that must be delivered in the next 7 days based on their final delivery date. This keeps your team focused on immediate priorities.',
              side: "bottom"
            }
          },
          {
            element: '.stat-overdue',
            popover: {
              title: 'Overdue Invoices',
              description: 'Invoices that have passed their expected delivery date but are still marked ACTIVE. These require immediate attention to avoid client dissatisfaction.',
              side: "bottom"
            }
          },
          {
            element: '.wip-summary',
            popover: {
              title: 'WIP Pipeline Summary',
              description: 'A live snapshot of exactly how many orders are sitting in each stage of your production pipeline right now.',
              side: "left"
            }
          }
        ]}
      />
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            ZyOps operational overview at a glance.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <DashboardFilter onFilterChange={setDateRange} />
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!data) return;
                const rows = [
                  ["Metric", "Value"],
                  ["Total Invoices", data.stats.totalInvoices],
                  ["Active Invoices", data.stats.activeInvoices],
                  ["Urgent Deliveries", data.stats.deliveriesThisWeek],
                  ["Overdue Invoices", data.stats.overdueInvoices],
                  ["Total Leads", data.stats.totalLeads],
                  ["Items in Production (WIP)", data.stats.totalWip],
                ];
                data.wipPhases.forEach((phase: any) => {
                  rows.push([`WIP: ${phase.name}`, phase.count.toString()]);
                });
                
                const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `zyops_dashboard_${dateRange.startDate}_${dateRange.endDate}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              }}
              disabled={isLoading || isFetching || !data}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Export as CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data?.stats ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm font-medium">
          Failed to load dashboard stats. Please try refreshing.
        </div>
      ) : (
        <>
          {/* 4 Stat Cards: 4 per row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              label="Total Invoices"
              value={data.stats.totalInvoices}
              delta={data.stats.totalInvoicesDelta}
              icon={FileText}
              accentClass="bg-indigo-700"
              href="/dashboard/invoices"
              explanation={`Total Invoices (${data.stats.totalInvoices}) = All invoices created this period.`}
            />
            <StatCard
              label="Active Invoices"
              value={data.stats.activeInvoices}
              icon={TrendingUp}
              accentClass="bg-blue-600"
              href="/dashboard/invoices?filter=active"
              explanation={`Active Invoices (${data.stats.activeInvoices}) = Invoices that have not been closed or deleted.`}
            />
            <div className="stat-urgent">
              <StatCard
                label="Deliveries This Week"
                value={data.stats.deliveriesThisWeek}
                icon={Clock}
                accentClass="bg-green-600"
                subLabel="Due within 7 days"
                href="/dashboard/invoices?filter=deliveries"
                explanation={`Deliveries (${data.stats.deliveriesThisWeek}) = Active invoices with delivery dates in the next 7 days.`}
              />
            </div>
            <div className="stat-overdue">
              <StatCard
                label="Overdue Invoices"
              value={data.stats.overdueInvoices}
              delta={data.stats.overdueInvoicesDelta}
              icon={AlertTriangle}
              accentClass={data.stats.overdueInvoices > 0 ? "bg-red-600" : "bg-slate-400"}
              subLabel="Past delivery date"
              href="/dashboard/invoices?filter=overdue"
              isDanger={true}
              explanation={`Overdue (${data.stats.overdueInvoices}) = Active invoices past their expected delivery date.`}
            />
            </div>
          </div>

          {/* Row: Urgent + WIP Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <UrgentDeliveriesPanel deliveries={data.urgentDeliveries} />
            </div>

            <div className="bg-white rounded-xl border shadow-sm p-6 wip-summary">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-syne text-slate-800">WIP Pipeline</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{data.stats.totalWip} total items</p>
                </div>
                <Link
                  href="/dashboard/work-in-progress"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Board <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <WIPSummaryBar phases={data.wipPhases} total={data.stats.totalWip} />
            </div>
          </div>

          {/* Row: Recent Invoices + Recent Quotations + Final Check */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold font-syne text-slate-800">Recent Invoices</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last 10 created</p>
                </div>
                <Link
                  href="/dashboard/invoices"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <RecentInvoicesTable invoices={data.recentInvoices} />
            </div>

            {/* Right column: Recent Quotations + Final Check */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold font-syne text-slate-800">Recent Quotations</h2>
                  <Link
                    href="/dashboard/quotations"
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <RecentQuotationsCard quotations={quotationsData || []} />
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-base font-bold font-syne text-slate-800 mb-4">Final Check Status</h2>
                <FinalCheckStatus
                  pending={data.finalCheck.pending}
                  completedThisMonth={data.finalCheck.completedThisMonth}
                />
              </div>
            </div>
          </div>

          {/* Team Performance + Admin Analytics */}
          <TeamPerformance />
          {session?.user?.role === "ADMIN" && <AdminAnalytics />}

          {session?.user?.role === "ADMIN" && (
            <div className="mt-8">
              <InsightsPanel />
            </div>
          )}
        </>
      )}
    </div>
  );
}


