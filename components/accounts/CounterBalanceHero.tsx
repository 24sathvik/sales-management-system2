/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

const CATEGORIES_CREDIT = ["INVOICE_ADVANCE", "INVOICE_BALANCE", "INVOICE_FULL_PAYMENT", "MISC_INCOME"];
const CATEGORIES_DEBIT = ["VENDOR_PAYMENT", "OVERHEAD", "MISC_EXPENSE"];
const MODES = ["CASH", "ONLINE", "UPI"];

function QuickEntryModal({
  type,
  onClose,
  onSaved,
}: { type: "CREDIT" | "DEBIT"; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    mode: "CASH",
    amount: "",
    description: "",
    category: type === "CREDIT" ? "INVOICE_FULL_PAYMENT" : "MISC_EXPENSE",
    date: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["accounts-transactions"] });
      const previous = queryClient.getQueryData<any[]>(["accounts-transactions"]);
      if (previous) {
        queryClient.setQueryData<any[]>(["accounts-transactions"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            transactions: [{ ...data, id: "temp-" + Date.now(), createdAt: new Date().toISOString() }, ...old.transactions]
          };
        });
      }
      return { previous };
    },
    onSuccess: () => { toast.success(`${type === "CREDIT" ? "Credit" : "Debit"} recorded.`); onSaved(); },
    onError: (err, newTx, context: any) => {
      toast.error("Failed to save transaction.");
      if (context?.previous) {
        queryClient.setQueryData(["accounts-transactions"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
    }
  });

  const categories = type === "CREDIT" ? CATEGORIES_CREDIT : CATEGORIES_DEBIT;
  const accentColor = type === "CREDIT" ? "bg-green-600" : "bg-red-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className={`${accentColor} text-white px-6 py-4 flex items-center justify-between`}>
          <h3 className="font-bold text-lg">{type === "CREDIT" ? "➕ Add Credit" : "➖ Add Debit"}</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                {MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount (₹)</label>
            <input type="number" min={0} placeholder="0.00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage font-bold text-base"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
              {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
            <input type="text" placeholder="e.g. INV-0042 advance payment" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Invoice No. (optional)</label>
            <input type="text" placeholder="INV-0042" value={form.invoiceNumber}
              onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            />
          </div>
          <button
            disabled={!form.amount || !form.description || mutation.isPending}
            onClick={() => mutation.mutate(form)}
            className={`w-full h-11 ${accentColor} text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity`}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save {type === "CREDIT" ? "Credit" : "Debit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CounterBalanceHero({ balance, receivables }: { balance: any, receivables?: number }) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<"CREDIT" | "DEBIT" | null>(null);

  const total = balance?.total ?? 0;
  const cash = balance?.cash ?? 0;
  const online = balance?.online ?? 0;
  const upi = balance?.upi ?? 0;
  const lastUpdated = balance?.lastUpdated;

  function onSaved() {
    setModal(null);
    queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
  }

  return (
    <>
      <div
        className="rounded-2xl p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 60%, var(--bg-sidebar-solid) 100%)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main balance */}
          <div className="flex-1">
            <p className="text-white/70 text-sm font-semibold tracking-wide mb-1 uppercase">Current Counter Balance</p>
            <div className={`text-4xl md:text-6xl font-bold tracking-tight font-syne ${total < 0 ? "text-red-300" : "text-white"}`}>
              {fmt(total)}
            </div>
            {lastUpdated && (
              <p className="text-white/50 text-xs mt-2">
                Last updated: {new Date(lastUpdated).toLocaleString("en-IN")}
              </p>
            )}

            {/* Mode breakdown pills */}
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                { label: "💰 Cash", value: cash },
                { label: "📱 Online", value: online },
                { label: "🔄 UPI", value: upi },
              ].map(pill => (
                <div key={pill.label} className="bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
                  <span className="text-white/70">{pill.label}: </span>
                  <span className={`font-bold ${pill.value < 0 ? "text-red-300" : "text-emerald-300"}`}>
                    {fmt(pill.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 md:flex-col">
            <button
              onClick={() => setModal("CREDIT")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" /> Add Credit
            </button>
            <button
              onClick={() => setModal("DEBIT")}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-white/60 text-white hover:bg-white/10 font-bold rounded-xl transition-colors"
            >
              <Minus className="w-5 h-5" /> Add Debit
            </button>
          </div>
        </div>

        {/* Financial Breakdown Panel */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Balance Composition</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 rounded-lg p-4 flex justify-between items-center backdrop-blur-sm">
              <span className="text-sm font-medium text-white/80">Total Collected (Credits)</span>
              <span className="font-bold text-emerald-300">{fmt(balance?.totalReceived ?? 0)}</span>
            </div>
            <div className="bg-black/20 rounded-lg p-4 flex justify-between items-center backdrop-blur-sm">
              <span className="text-sm font-medium text-white/80">Adjustments (Debits)</span>
              <span className="font-bold text-red-300">{fmt(balance?.totalAdjustments ?? 0)}</span>
            </div>
            <div className="bg-black/20 rounded-lg p-4 flex justify-between items-center backdrop-blur-sm">
              <span className="text-sm font-medium text-white/80">Total Pending (Receivables)</span>
              <span className="font-bold text-amber-300">{fmt(receivables ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <QuickEntryModal type={modal} onClose={() => setModal(null)} onSaved={onSaved} />
      )}
    </>
  );
}
