/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/EmptyState";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

const TYPE_STYLES: Record<string, string> = {
  CREDIT: "bg-green-100 text-green-700 border-green-200",
  DEBIT: "bg-red-100 text-red-700 border-red-200",
};
const MODE_STYLES: Record<string, string> = {
  CASH: "bg-amber-100 text-amber-700",
  ONLINE: "bg-blue-100 text-blue-700",
  UPI: "bg-purple-100 text-purple-700",
  BANK_TRANSFER: "bg-indigo-100 text-indigo-700",
};

function getTxnType(t: any) {
  if (t.category === "INVOICE_ADVANCE") return "Advance";
  if (t.category === "INVOICE_BALANCE") return t.description?.toLowerCase().includes("partial") ? "Partial Payment" : "Balance Payment";
  if (t.category === "INVOICE_FULL_PAYMENT") return "Full Payment";
  return t.category.replace(/_/g, " ");
}

export function TransactionLedger() {
  const [modeTab, setModeTab] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const params = new URLSearchParams();
  if (modeTab !== "ALL") params.set("mode", modeTab);
  if (typeFilter) params.set("type", typeFilter);
  if (search) params.set("search", search);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("page", String(page));
  params.set("limit", "50");
  if (cursor && direction) {
    params.set("cursor", cursor);
    params.set("direction", direction);
  }

  const handlePageChange = (newPage: number, newCursor?: string, newDirection?: "next" | "prev") => {
    setPage(newPage);
    if (newCursor && newDirection) {
      setCursor(newCursor);
      setDirection(newDirection);
    } else {
      setCursor(null);
      setDirection(null);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["accounts-transactions", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 15000,
  });

  const transactions: any[] = data?.data?.transactions || [];
  const totals = data?.data?.totals || {};
  const pagination = data?.data?.pagination || {};

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="p-4 border-b border-brand-border space-y-3">
        <h2 className="text-base font-bold text-brand-forest">Transaction Ledger</h2>

        {/* Mode Tabs */}
        <div className="flex gap-1 bg-brand-cream rounded-lg p-1 w-fit">
          {["ALL", "CASH", "ONLINE", "UPI"].map(tab => (
            <button key={tab} onClick={() => { setModeTab(tab); handlePageChange(1); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${modeTab === tab ? "bg-brand-forest text-white shadow-sm" : "text-brand-muted hover:text-brand-forest"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); handlePageChange(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none">
            <option value="">All Types</option>
            <option value="CREDIT">Credits</option>
            <option value="DEBIT">Debits</option>
          </select>
          <input type="text" placeholder="Search description / invoice…" value={search}
            onChange={e => { setSearch(e.target.value); handlePageChange(1); }}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none flex-1 min-w-[180px]"
          />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
          <span className="text-brand-muted text-xs self-center">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 text-xs bg-brand-cream border border-brand-border rounded-lg outline-none" />
        </div>

        {/* Totals bar */}
        {totals && (
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="text-green-600">Credits: <span className="font-mono">{fmt(totals.totalCredits || 0)}</span></span>
            <span className="text-slate-400">|</span>
            <span className="text-red-500">Debits: <span className="font-mono">{fmt(totals.totalDebits || 0)}</span></span>
            <span className="text-slate-400">|</span>
            <span className={totals.netBalance >= 0 ? "text-brand-forest" : "text-red-600"}>
              Net: <span className="font-mono">{fmt(totals.netBalance || 0)}</span>
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-sm hidden md:table" style={{ minWidth: "900px" }}>
            <thead className="bg-brand-cream text-brand-forest">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Invoice Number</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Client / Party Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Recorded By</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Mode of Payment</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Transaction Type</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-slate-100">
                  <td className="px-3 py-2.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-3 py-2.5"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="px-3 py-2.5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-3 py-2.5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-3 py-2.5"><div className="h-5 bg-slate-200 rounded-full w-16"></div></td>
                  <td className="px-3 py-2.5"><div className="h-5 bg-slate-200 rounded-full w-20"></div></td>
                  <td className="px-3 py-2.5"><div className="h-4 bg-slate-200 rounded w-16 ml-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Mobile Cards Skeleton */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                   <div className="flex justify-between items-start">
                     <div className="h-4 bg-slate-200 rounded w-24"></div>
                     <div className="h-4 bg-slate-200 rounded w-16"></div>
                   </div>
                   <div className="h-4 bg-slate-200 rounded w-32"></div>
                   <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
             ))}
          </div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8">
          <EmptyState 
            icon={Receipt} 
            title="No transactions found" 
            description="No transactions match the selected filters." 
            compact={true}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <table className="w-full text-sm hidden md:table" style={{ minWidth: "900px" }}>
            <thead className="bg-brand-cream text-brand-forest sticky top-0">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Invoice Number</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Client / Party Name</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Recorded By</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Mode of Payment</th>
                <th className="px-3 py-2.5 text-left text-xs font-bold">Transaction Type</th>
                <th className="px-3 py-2.5 text-right text-xs font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}
                  className={`border-t border-brand-border/40 border-l-4 ${t.type === "CREDIT" ? "border-l-green-400 hover:bg-green-50/30" : "border-l-red-400 hover:bg-red-50/30"} transition-colors`}>
                  <td className="px-3 py-2.5 text-xs font-mono text-brand-forest font-bold">{t.invoiceNumber || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-700 font-medium">{t.invoice?.customerName || "—"}</td>
                  <td className="px-3 py-2.5 text-xs text-slate-600 truncate max-w-[120px]" title={t.user?.name || "System"}>
                    {t.user?.name?.split(" ")[0] || "System"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-brand-muted whitespace-nowrap font-mono">
                    {format(new Date(t.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${MODE_STYLES[t.mode] || "bg-slate-100 text-slate-600"}`}>
                      {t.mode}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold capitalize ${TYPE_STYLES[t.type] || ""}`}>
                      {getTxnType(t)}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-bold text-sm font-mono ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                    {t.type === "CREDIT" ? "+" : "−"}{fmt(Number(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col divide-y divide-brand-border/40">
             {transactions.map((t: any) => (
                <div key={t.id} className={`p-4 flex flex-col gap-2 border-l-4 ${t.type === "CREDIT" ? "border-l-green-400 bg-green-50/10" : "border-l-red-400 bg-red-50/10"}`}>
                  <div className="flex justify-between items-start">
                     <div>
                        <span className="font-bold text-brand-forest font-mono text-sm">{t.invoiceNumber || "—"}</span>
                        <div className="text-sm font-medium text-slate-700">{t.invoice?.customerName || "—"}</div>
                     </div>
                     <div className={`text-right font-bold text-base font-mono ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "CREDIT" ? "+" : "−"}{fmt(Number(t.amount))}
                     </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs mt-1">
                     <span className={`px-2 py-0.5 rounded-full border font-bold capitalize ${TYPE_STYLES[t.type] || ""}`}>
                       {getTxnType(t)}
                     </span>
                     <span className={`px-2 py-0.5 rounded-full font-bold ${MODE_STYLES[t.mode] || "bg-slate-100 text-slate-600"}`}>
                       {t.mode}
                     </span>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                     <span className="font-mono">{format(new Date(t.date), "dd MMM yyyy")}</span>
                     <span>By {t.user?.name?.split(" ")[0] || "System"}</span>
                  </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 50 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-brand-cream/30">
          <span className="text-xs text-brand-muted">Showing {((page - 1) * 50) + 1}–{Math.min(page * 50, pagination.total)} of {pagination.total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => {
              const firstTxn = transactions[0];
              handlePageChange(page - 1, firstTxn?.id, "prev");
            }}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">←</button>
            <button disabled={page * 50 >= pagination.total} onClick={() => {
              const lastTxn = transactions[transactions.length - 1];
              handlePageChange(page + 1, lastTxn?.id, "next");
            }}
              className="px-3 py-1 text-xs border border-brand-border rounded-lg disabled:opacity-40 hover:bg-white transition-colors">→</button>
          </div>
        </div>
      )}

    </div>
  );
}
