/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";
import { TeamMemberStat } from "./LeaderboardCard";
import { useSession } from "next-auth/react";

export function PerformanceCharts({ teamData }: { teamData: TeamMemberStat[] }) {
  const { data: session } = useSession();
  const [selectedUserId, setSelectedUserId] = useState<string>(session?.user?.id || "");
  const [trendData, setTrendData] = useState<any[]>([]);
  const [trendTotals, setTrendTotals] = useState<{ invoices: number; revenue: number } | null>(null);
  const [loadingTrend, setLoadingTrend] = useState(false);

  // Date range state for personal trend
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
  const defaultEnd = now.toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  // Initialize selected default
  useEffect(() => {
    if (!selectedUserId && session?.user?.id && teamData.find(t => t.userId === session.user.id)) {
      setSelectedUserId(session.user.id);
    } else if (!selectedUserId && teamData.length > 0) {
      setSelectedUserId(teamData[0].userId);
    }
  }, [session, teamData, selectedUserId]);

  const fetchTrend = useCallback(async () => {
    if (!selectedUserId) return;
    setLoadingTrend(true);
    try {
      const url = `/api/dashboard/user-trend?userId=${selectedUserId}&startDate=${startDate}&endDate=${endDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        // New API returns { totals, trend }
        setTrendData(json.data.trend ?? json.data);
        setTrendTotals(json.data.totals ?? null);
      }
    } catch(e) { console.error(e); }
    setLoadingTrend(false);
  }, [selectedUserId, startDate, endDate]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  // Chart 1: Invoices by Team Member
  const invoiceData = [...teamData].sort((a, b) => b.invoiceCount - a.invoiceCount);
  
  // Chart 2: Revenue by Team Member
  const revenueData = [...teamData].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = revenueData.length > 0 ? revenueData[0].revenue : 1;

  // Custom tooltips
  const CustomTooltipInvoices = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p className="text-primary font-medium">Invoices: {payload[0].value}</p>
          <p className="text-muted-foreground text-xs mt-1">Closed: {payload[0].payload.completionRate.toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipRevenue = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">{formatCurrency(payload[0].value)}</p>
          <p className="text-muted-foreground text-xs mt-1">Avg/Invoice: {formatCurrency(payload[0].payload.avgInvoiceValue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 col-span-1 lg:col-span-2">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Invoices Bar Chart */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center md:text-left">
            <h3 className="font-semibold leading-none tracking-tight text-base">Invoices Generated</h3>
            <p className="text-sm text-slate-500">Total invoices created this month</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 12}} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <Tooltip cursor={{ fill: 'var(--accent)' }} content={<CustomTooltipInvoices />} />
                <Bar dataKey="invoiceCount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {invoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.userId === session?.user?.id ? 'var(--brand-primary)' : 'var(--brand-primary-light)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Bar Chart (Horizontal) */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center md:text-left">
            <h3 className="font-semibold leading-none tracking-tight text-base">Revenue Leaderboard</h3>
            <p className="text-sm text-slate-500">Gross revenue generated this month</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={80} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--accent)' }} content={<CustomTooltipRevenue />} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {revenueData.map((entry, index) => {
                    // Opacity relative to max revenue
                    const ratio = entry.revenue / maxRevenue;
                    const opacity = Math.max(0.4, ratio);
                    return <Cell key={`rcell-${index}`} fill={`rgba(199, 125, 46, ${opacity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Personal Trend Line with Date Range */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col space-y-1.5">
            <h3 className="font-semibold leading-none tracking-tight text-base">Personal Revenue Trend</h3>
            <p className="text-sm text-slate-500">
              Invoices &amp; revenue progression
              {trendTotals && (
                <span className="ml-2 font-medium text-slate-700">
                  — {trendTotals.invoices} invoices · {formatCurrency(trendTotals.revenue)}
                </span>
              )}
            </p>
          </div>
          {/* Controls: date range + user selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-7 rounded-md border border-slate-200 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium whitespace-nowrap">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-7 rounded-md border border-slate-200 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-7 text-xs rounded-md border border-slate-200 bg-white px-2 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="" disabled>Select member</option>
              {teamData.map(u => (
                <option key={u.userId} value={u.userId}>
                  {u.name} {u.userId === session?.user?.id ? "(You)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="p-6 h-[280px]">
          {loadingTrend ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse text-sm">Loading trend...</div>
          ) : trendData.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">No data for selected range.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{fontSize: 11}} tickLine={false} axisLine={false} domain={[0, 'auto']} tickFormatter={(v) => Math.floor(v).toString()} />
                <YAxis yAxisId="right" orientation="right" allowDecimals={false} tickFormatter={(v) => `₹${Math.floor(v/1000)}k`} tick={{fontSize: 11}} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-default)', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [name === 'revenue' ? formatCurrency(Number(value)) : value, name === 'revenue' ? 'Revenue' : 'Invoices']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="invoices" stroke="var(--status-info)" strokeWidth={3} dot={{ r: 4, fill: 'var(--status-info)' }} activeDot={{ r: 6 }} name="My Invoices" />
                <Line yAxisId="left" type="monotone" dataKey="storeInvoices" stroke="var(--text-muted)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Total Store Invoices" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-primary)' }} activeDot={{ r: 6 }} name="My Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="storeRevenue" stroke="var(--text-heading)" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Total Store Revenue" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

