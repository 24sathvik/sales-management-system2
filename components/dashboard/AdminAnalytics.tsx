/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const COLORS = [
  "var(--brand-primary)", "var(--brand-primary-dark)", "var(--brand-primary-light)", "var(--brand-accent)", "var(--brand-accent-dark)",
  "var(--status-info)", "var(--status-warning)", "var(--status-error)", "var(--status-success)",
];

export function AdminAnalytics() {
  const [data, setData] = useState<{ monthlyData: any[]; categoryDistribution: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Date range for category distribution chart
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().slice(0, 10);
  const defaultEnd = now.toISOString().slice(0, 10);
  const [catStartDate, setCatStartDate] = useState(defaultStart);
  const [catEndDate, setCatEndDate] = useState(defaultEnd);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/dashboard/admin-stats?months=12&catStart=${catStartDate}&catEnd=${catEndDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [catStartDate, catEndDate]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  if (loading) return (
    <div className="mt-8 border-t pt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 bg-slate-100 rounded-xl h-[420px] border border-slate-200" />
      <div className="bg-slate-100 rounded-xl h-[420px] border border-slate-200" />
    </div>
  );
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 border-t pt-8">
      <div className="lg:col-span-3 mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Admin &amp; Executive Analytics</h2>
        <p className="text-muted-foreground text-sm">Long-term business insights and health metrics.</p>
      </div>

      {/* 12-Month Historical Breakdown */}
      <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
        <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center sm:text-left">
          <h3 className="font-semibold leading-none tracking-tight text-base">12-Month Historical Breakdown</h3>
          <p className="text-sm text-slate-500">Volume, revenue, and net profitability per month</p>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Month</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Invoices</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Revenue</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                  <td className="py-3 font-medium whitespace-nowrap">{row.month}</td>
                  <td className="py-3 text-right tabular-nums">{row.totalInvoices}</td>
                  <td className="py-3 text-right font-semibold tabular-nums">₹{parseFloat(String(row.revenue)).toLocaleString("en-IN")}</td>
                  <td className={`py-3 text-right font-bold tabular-nums ${row.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {row.netProfit >= 0 ? "+" : ""}₹{Math.abs(parseFloat(String(row.netProfit))).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Distribution with Date Range */}
      <div className="bg-white rounded-xl border shadow-sm flex flex-col">
        <div className="p-6 pb-3 flex flex-col space-y-3 text-center sm:text-left">
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-base">Category Distribution</h3>
            <p className="text-sm text-slate-500">Revenue by invoice category</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium">From</label>
              <input
                type="date"
                value={catStartDate}
                onChange={(e) => setCatStartDate(e.target.value)}
                className="text-xs h-7 rounded-md border border-slate-200 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium">To</label>
              <input
                type="date"
                value={catEndDate}
                onChange={(e) => setCatEndDate(e.target.value)}
                className="text-xs h-7 rounded-md border border-slate-200 px-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>
        <div className="p-6 pt-0 flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.categoryDistribution}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: "8px", border: "1px solid var(--border-default)", fontSize: "12px" }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: "10px", paddingTop: "16px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

