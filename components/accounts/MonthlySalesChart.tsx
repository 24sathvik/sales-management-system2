/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export function MonthlySalesChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-brand-border shadow-sm p-6 text-center text-brand-muted text-sm">
        No sales data available for the chart.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm p-6">
      <h2 className="text-base font-bold text-brand-forest mb-6">Monthly Sales Trend — Last 12 Months</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border-default)" }}
          />
          <YAxis
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any, name: any) => [fmt(Number(value)), name === "revenue" ? "Revenue" : "Net Profit"]}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
          <Legend
            formatter={(value: any) => value === "revenue" ? "Revenue" : "Net Profit"}
            wrapperStyle={{ fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--brand-primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--brand-primary)" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="profit"
            stroke="var(--brand-accent)"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "var(--brand-accent)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
