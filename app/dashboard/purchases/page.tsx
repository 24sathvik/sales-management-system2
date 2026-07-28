/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  TrendingUp, TrendingDown, IndianRupee, Percent,
  Search, Filter, ChevronUp, ChevronDown, X, Edit2, Trash2, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PurchaseDrawer } from "@/components/purchases/PurchaseDrawer";
import { PurchasesPageSkeleton } from "@/components/purchases/PurchasesPageSkeleton";

// ---- helpers ----
function fmt(n: any) {
  const num = Number(n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num);
}
function fmtPct(n: any) { return `${Number(n ?? 0).toFixed(1)}%`; }

function ProfitBadge({ profit, pct }: { profit: number; pct: number }) {
  if (profit < 0) return (
    <span className="flex items-center gap-1 text-red-600 font-bold">
      <TrendingDown className="w-3.5 h-3.5" />
      {fmt(profit)}
      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold ml-1">LOSS</span>
    </span>
  );
  if (pct >= 40) return <span className="text-green-600 font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />{fmt(profit)}</span>;
  if (pct >= 20) return <span className="text-amber-600 font-bold">{fmt(profit)}</span>;
  return <span className="text-red-500 font-semibold">{fmt(profit)}</span>;
}

function PctBadge({ pct }: { pct: number }) {
  if (pct >= 40) return <span className="text-green-600 font-bold">{fmtPct(pct)}</span>;
  if (pct >= 20) return <span className="text-amber-600 font-bold">{fmtPct(pct)}</span>;
  return <span className="text-red-500 font-semibold">{fmtPct(pct)}</span>;
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PARTIAL: "bg-orange-100 text-orange-700",
};

function VendorCell({ name, cost, status }: { name?: string; cost?: number; status?: string }) {
  if (!name && !cost) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-col gap-0.5 min-w-[120px]">
      <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px]" title={name}>{name || "—"}</span>
      <span className="text-xs text-brand-forest font-bold">{fmt(cost ?? 0)}</span>
      {status && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold w-fit ${STATUS_COLORS[status] || ""}`}>{status}</span>}
    </div>
  );
}

const LEAD_SOURCES = ["Walk-in", "Referral", "Instagram", "Google", "WhatsApp", "Phone", "Other"];

export default function PurchasesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [leadSource, setLeadSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("completedAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Drawer
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (leadSource) params.set("leadSource", leadSource);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  params.set("sortBy", sortBy);
  params.set("order", order);

  const { data: purchases = [], isLoading } = useQuery<any[]>({
    queryKey: ["purchases", params.toString()],
    queryFn: async () => {
      const res = await fetch(`/api/purchases?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      toast.success("Purchase record removed.");
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  // Summary stats from current filtered set
  const stats = useMemo(() => {
    const totalRevenue = purchases.reduce((s: number, p: any) => s + Number(p.billValue ?? 0), 0);
    const totalCost = purchases.reduce((s: number, p: any) => s + Number(p.totalProductionCost ?? 0), 0);
    const totalProfit = purchases.reduce((s: number, p: any) => s + Number(p.profit ?? 0), 0);
    const avgMargin = purchases.length
      ? purchases.reduce((s: number, p: any) => s + Number(p.profitPercentage ?? 0), 0) / purchases.length
      : 0;
    return { totalRevenue, totalCost, totalProfit, avgMargin };
  }, [purchases]);

  // Unique categories from data
  const categories = useMemo(() => {
    const cats = new Set<string>(purchases.map((p: any) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [purchases]);

  // Totals row
  const totals = useMemo(() => ({
    billValue: purchases.reduce((s: number, p: any) => s + Number(p.billValue ?? 0), 0),
    designer: purchases.reduce((s: number, p: any) => s + Number(p.totalDesignerCost ?? 0), 0),
    printer: purchases.reduce((s: number, p: any) => s + Number(p.totalPrinterCost ?? 0), 0),
    rawMat: purchases.reduce((s: number, p: any) => s + Number(p.totalRawMaterialCost ?? 0), 0),
    postProc: purchases.reduce((s: number, p: any) => s + Number(p.totalPostProcessCost ?? 0), 0),
    totalCost: purchases.reduce((s: number, p: any) => s + Number(p.totalProductionCost ?? 0), 0),
    profit: purchases.reduce((s: number, p: any) => s + Number(p.profit ?? 0), 0),
    avgPct: purchases.length
      ? purchases.reduce((s: number, p: any) => s + Number(p.profitPercentage ?? 0), 0) / purchases.length
      : 0,
  }), [purchases]);

  function toggleSort(field: string) {
    if (sortBy === field) setOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortBy(field); setOrder("desc"); }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortBy !== field) return null;
    return order === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Purchases</h1>
        <p className="text-sm text-brand-muted mt-1">Production cost tracking &amp; profit analysis</p>
      </div>

      {/* ── SUMMARY STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(stats.totalRevenue), icon: <IndianRupee className="w-5 h-5" />, color: "brand-forest" },
          { label: "Total Production Cost", value: fmt(stats.totalCost), icon: <TrendingDown className="w-5 h-5" />, color: "brand-sage" },
          { label: "Gross Profit", value: fmt(stats.totalProfit), icon: <TrendingUp className="w-5 h-5" />, color: stats.totalProfit >= 0 ? "green-600" : "red-600" },
          { label: "Avg Profit Margin", value: fmtPct(stats.avgMargin), icon: <Percent className="w-5 h-5" />, color: stats.avgMargin >= 20 ? "green-600" : "amber-600" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-brand-border shadow-sm p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-brand-cream text-${card.color}`}>{card.icon}</div>
            <div>
              <p className="text-xs text-brand-muted font-medium">{card.label}</p>
              <p className={`text-xl font-bold text-${card.color}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2 bg-brand-cream border border-brand-border rounded-lg px-3 h-9 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-brand-muted flex-shrink-0" />
          <input
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-brand-muted"
            placeholder="Search customer, invoice, description…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-brand-muted" /></button>}
        </div>

        <select value={category} onChange={e => setCategory(e.target.value)}
          className="h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg text-brand-black outline-none">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={leadSource} onChange={e => setLeadSource(e.target.value)}
          className="h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg text-brand-black outline-none">
          <option value="">All Lead Sources</option>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg outline-none" />
          <span className="text-brand-muted text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg outline-none" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-muted" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg outline-none">
            <option value="completedAt">Date</option>
            <option value="profit">Profit (₹)</option>
            <option value="billValue">Bill Value</option>
            <option value="profitPercentage">Profit %</option>
            <option value="totalProductionCost">Cost</option>
          </select>
          <button onClick={() => setOrder(o => o === "asc" ? "desc" : "asc")}
            className="h-9 px-3 bg-brand-cream border border-brand-border rounded-lg text-brand-black hover:bg-brand-border/50 transition-colors">
            {order === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {(search || category || leadSource || dateFrom || dateTo) && (
          <button onClick={() => { setSearch(""); setCategory(""); setLeadSource(""); setDateFrom(""); setDateTo(""); }}
            className="h-9 px-3 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="flex-1 bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden flex flex-col">
        {isLoading ? (
        <PurchasesPageSkeleton />
        ) : purchases.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-muted gap-2 p-8">
            <IndianRupee className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">No purchase records found.</p>
            <p className="text-xs opacity-70">Close a Final Check job to generate one.</p>
          </div>
        ) : (
          <div className="overflow-auto flex-1 max-h-[calc(100vh-380px)]">
            {/* Desktop Table */}
            <table className="w-full text-sm border-collapse hidden md:table" style={{ minWidth: "2400px" }}>
              <thead className="bg-primary text-white sticky top-0 z-20">
                <tr>
                  {/* Sticky columns */}
                  <th className="sticky left-0 z-30 bg-brand-forest px-3 py-3 text-left text-xs font-bold whitespace-nowrap w-10">#</th>
                  <th className="px-3 py-3 bg-brand-forest text-left text-xs font-bold whitespace-nowrap cursor-pointer min-w-[110px]" onClick={() => toggleSort("invoiceNumber")}>
                    Invoice No <SortIcon field="invoiceNumber" />
                  </th>
                  <th className="px-3 py-3 bg-brand-forest text-left text-xs font-bold whitespace-nowrap min-w-[160px]">Customer</th>
                  {/* Scrollable columns */}
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap">Category</th>
                  <th className="px-3 py-3 text-left text-xs font-bold min-w-[160px]">Description</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap">Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap cursor-pointer" onClick={() => toggleSort("billValue")}>Bill Value <SortIcon field="billValue" /></th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap">Lead Source</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Designer 1</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Designer 2</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Printer 1</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Printer 2</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Raw Mat 1</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Raw Mat 2</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Post Proc 1</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap min-w-[150px]">Post Proc 2</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap cursor-pointer" onClick={() => toggleSort("totalProductionCost")}>Total Cost <SortIcon field="totalProductionCost" /></th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap cursor-pointer" onClick={() => toggleSort("profit")}>Profit (₹) <SortIcon field="profit" /></th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap cursor-pointer" onClick={() => toggleSort("profitPercentage")}>Profit % <SortIcon field="profitPercentage" /></th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap">Completed</th>
                  <th className="px-3 py-3 text-left text-xs font-bold min-w-[160px]">Notes</th>
                  <th className="px-3 py-3 text-left text-xs font-bold whitespace-nowrap">Actions</th>
                </tr>
              </thead>

              <tbody>
                {purchases.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b border-brand-border/50 hover:bg-brand-cream/30 transition-colors group">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-brand-cream/30 px-3 py-2.5 text-xs text-brand-muted">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-xs text-brand-forest">{p.invoiceNumber}</td>
                    <td className="px-3 py-2.5 font-semibold text-xs max-w-[160px] truncate" title={p.customerName}>{p.customerName}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="bg-brand-cream border border-brand-border text-brand-forest px-2 py-0.5 rounded-full text-[10px] font-semibold">{p.category}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 max-w-[160px] truncate" title={p.description}>{p.description}</td>
                    <td className="px-3 py-2.5 text-xs text-center font-semibold">{p.quantity}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-brand-forest">{fmt(p.billValue)}</td>
                    <td className="px-3 py-2.5 text-xs text-brand-muted">{p.leadSource || "—"}</td>
                    <td className="px-3 py-2.5"><VendorCell name={p.designer1Name} cost={p.designer1Cost} status={p.designer1PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.designer2Name} cost={p.designer2Cost} status={p.designer2PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.printer1Name} cost={p.printer1Cost} status={p.printer1PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.printer2Name} cost={p.printer2Cost} status={p.printer2PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.rawMaterial1Name} cost={p.rawMaterial1Cost} status={p.rawMaterial1PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.rawMaterial2Name} cost={p.rawMaterial2Cost} status={p.rawMaterial2PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.postProcess1Name} cost={p.postProcess1Cost} status={p.postProcess1PaymentStatus} /></td>
                    <td className="px-3 py-2.5"><VendorCell name={p.postProcess2Name} cost={p.postProcess2Cost} status={p.postProcess2PaymentStatus} /></td>
                    <td className="px-3 py-2.5 text-xs font-bold text-slate-700">{fmt(p.totalProductionCost)}</td>
                    <td className="px-3 py-2.5 text-xs"><ProfitBadge profit={Number(p.profit)} pct={Number(p.profitPercentage)} /></td>
                    <td className="px-3 py-2.5 text-xs"><PctBadge pct={Number(p.profitPercentage)} /></td>
                    <td className="px-3 py-2.5 text-xs text-brand-muted whitespace-nowrap">{p.completedAt ? format(new Date(p.completedAt), "dd MMM yyyy") : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 max-w-[160px] truncate" title={p.notes}>{p.notes || "—"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditTarget(p)}
                          className="p-1.5 text-brand-sage hover:bg-brand-cream rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => { if (confirm("Remove this purchase record?")) deleteMutation.mutate(p.id); }}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* ── TOTALS ROW ── */}
                {purchases.length > 0 && (
                  <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
                    <td className="sticky left-0 z-10 bg-primary/5 px-3 py-3 text-xs text-primary uppercase tracking-wider" colSpan={2}>TOTALS</td>
                    <td className="px-3 py-3 text-xs text-text-secondary">{purchases.length} jobs</td>
                    <td colSpan={3} className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-xs font-bold text-primary">{fmt(totals.billValue)}</td>
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.designer)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.designer)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.printer)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.printer)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.rawMat)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.rawMat)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.postProc)}</td>
                    <td className="px-3 py-3 text-xs font-bold">{fmt(totals.postProc)}</td>
                    <td className="px-3 py-3 text-xs font-bold text-slate-700">{fmt(totals.totalCost)}</td>
                    <td className="px-3 py-3 text-xs"><ProfitBadge profit={totals.profit} pct={totals.avgPct} /></td>
                    <td className="px-3 py-3 text-xs"><PctBadge pct={totals.avgPct} /></td>
                    <td colSpan={3} className="px-3 py-3"></td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-brand-border/40">
              {purchases.map((p: any, i: number) => (
                <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-brand-forest font-mono block">{p.invoiceNumber}</span>
                      <span className="font-medium text-slate-800 text-base">{p.customerName}</span>
                    </div>
                    <span className="bg-brand-cream border border-brand-border text-brand-forest px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {p.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Bill Value</span>
                      <span className="font-bold text-brand-forest font-mono">{fmt(p.billValue)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Cost</span>
                      <span className="font-bold text-slate-700 font-mono">{fmt(p.totalProductionCost)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm bg-brand-cream/30 p-2 rounded-lg">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Profit</span>
                      <ProfitBadge profit={Number(p.profit)} pct={Number(p.profitPercentage)} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">Margin</span>
                      <PctBadge pct={Number(p.profitPercentage)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-brand-muted">
                      {p.completedAt ? format(new Date(p.completedAt), "dd MMM yyyy") : "—"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(p)}
                        className="p-2 text-brand-sage hover:bg-brand-cream rounded-md transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => { if (confirm("Remove this purchase record?")) deleteMutation.mutate(p.id); }}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Totals Mobile Card */}
              {purchases.length > 0 && (
                <div className="p-4 bg-primary/5 border-t-2 border-primary/20 flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-primary uppercase">Totals ({purchases.length} jobs)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Revenue:</span>
                    <span className="font-bold text-primary font-mono">{fmt(totals.billValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Cost:</span>
                    <span className="font-bold text-slate-700 font-mono">{fmt(totals.totalCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 mt-1 border-t border-primary/10">
                    <ProfitBadge profit={totals.profit} pct={totals.avgPct} />
                    <PctBadge pct={totals.avgPct} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT DRAWER ── */}
      {editTarget && (
        <PurchaseDrawer
          purchase={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
          }}
        />
      )}
    </div>
  );
}
