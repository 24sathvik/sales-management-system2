/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  IndianRupee, TrendingDown, TrendingUp, Percent, Calendar
} from "lucide-react";
import { CounterBalanceHero } from "@/components/accounts/CounterBalanceHero";
import { ExpensesTable } from "@/components/accounts/ExpensesTable";
import { TransactionLedger } from "@/components/accounts/TransactionLedger";
import { ReceivablesTable } from "@/components/accounts/ReceivablesTable";
import dynamic from "next/dynamic";
const MonthlySalesChart = dynamic(() => import("@/components/accounts/MonthlySalesChart").then(mod => mod.MonthlySalesChart), { ssr: false });
import { AccountsPageSkeleton } from "@/components/accounts/AccountsPageSkeleton";
import { MetricExplanation } from "@/components/ui/MetricExplanation";


function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}
function fmtPct(n: number) { return `${Number(n || 0).toFixed(1)}%`; }

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function MonthSummaryCards({ summary }: { summary: any }) {
  if (!summary) return null;

  const rev = summary.grossRevenue ?? 0;
  const cost = summary.totalProductionCost ?? 0;
  const grossProfit = summary.grossProfit ?? 0;
  const netProfit = summary.netProfit ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Gross Revenue", value: fmt(rev), icon: <IndianRupee className="w-5 h-5" />, color: "text-brand-forest", explanation: `Gross Revenue (₹${rev.toLocaleString("en-IN")}) = Sum of all closed invoices this month.` },
        { label: "Production Costs", value: fmt(cost), icon: <TrendingDown className="w-5 h-5" />, color: "text-slate-600", explanation: `Production Costs (₹${cost.toLocaleString("en-IN")}) = Sum of all purchase costs for this month's closed invoices.` },
        { label: "Gross Profit", value: fmt(grossProfit), icon: <TrendingUp className="w-5 h-5" />, color: grossProfit >= 0 ? "text-green-600" : "text-red-600", explanation: `Gross Profit (₹${grossProfit.toLocaleString("en-IN")}) = Gross Revenue - Production Costs` },
        { label: "Net Profit", value: fmt(netProfit), icon: <Percent className="w-5 h-5" />, color: netProfit >= 0 ? "text-green-600" : "text-red-600", explanation: `Net Profit (₹${netProfit.toLocaleString("en-IN")}) = Gross Profit - Monthly Overhead Expenses` },
      ].map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-brand-border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-brand-cream/50 text-brand-forest border border-brand-cream">{card.icon}</div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
              {card.label}
              {card.explanation && <MetricExplanation text={card.explanation} />}
            </p>
            <p className={`text-2xl font-black tracking-tight ${card.color}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AccountsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ["accounts-summary", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/summary?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["accounts-expenses", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/expenses?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  const { data: receivables } = useQuery({
    queryKey: ["accounts-receivables"],
    queryFn: async () => {
      const res = await fetch("/api/accounts/receivables");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 tour-accounts">
      
      <div>
        <h1 className="text-3xl font-bold font-syne tracking-tight text-brand-forest">Financial Summary</h1>
        <p className="text-sm text-brand-muted mt-1">Command center for all financial operations</p>
      </div>

      {sumLoading ? (
        <AccountsPageSkeleton />
      ) : (
        <>
          {/* 1. Counter Balance Hero */}
          <div className="tour-a-hero">
            <div data-tour="acc-balance"><CounterBalanceHero balance={summary?.counterBalance} receivables={summary?.receivables} />
          </div>

          {/* 2. Month Selector */}
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-brand-border w-fit shadow-sm">
            <Calendar className="w-5 h-5 text-brand-sage ml-2" />
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="h-9 px-3 text-sm font-bold bg-transparent text-brand-forest outline-none border-r border-brand-border/50">
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="h-9 px-3 text-sm font-bold bg-transparent text-brand-forest outline-none">
              {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* 3. Monthly Summary Cards */}
          <MonthSummaryCards summary={summary} />

          {/* 4. Monthly Expenses & Sales Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="tour-a-expenses">
              <ExpensesTable month={month} year={year} expenses={expenses} />
            </div>
            <MonthlySalesChart data={summary?.monthlySales || []} />
          </div>

          {/* 5. Receivables */}
          <ReceivablesTable data={receivables} />

          {/* 6. Transaction Ledger */}
          <div className="tour-a-ledger">
            <TransactionLedger />
          </div>
        </>
      )}
    </div>
  );
}
