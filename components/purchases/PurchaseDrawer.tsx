/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save, Loader2, TrendingUp, TrendingDown, IndianRupee } from "lucide-react";
import { toast } from "sonner";

const LEAD_SOURCES = ["Walk-in", "Referral", "Instagram", "Google", "WhatsApp", "Phone", "Other"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "PARTIAL"];
const PAYMENT_MODES = ["ONLINE", "CASH", "UPI", "BANK_TRANSFER"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function toNum(v: any) { return parseFloat(v) || 0; }

function computeLive(form: any, billValue: number) {
  const d = toNum(form.designer1Cost) + toNum(form.designer2Cost);
  const pr = toNum(form.printer1Cost) + toNum(form.printer2Cost);
  const rm = toNum(form.rawMaterial1Cost) + toNum(form.rawMaterial2Cost);
  const pp = toNum(form.postProcess1Cost) + toNum(form.postProcess2Cost);
  const totalCost = d + pr + rm + pp;
  const profit = billValue - totalCost;
  const pct = billValue > 0 ? (profit / billValue) * 100 : 0;
  return { totalDesignerCost: d, totalPrinterCost: pr, totalRawMaterialCost: rm, totalPostProcessCost: pp, totalCost, profit, pct };
}

function FieldGroup({ label, prefix, form, onChange }: { label: string; prefix: string; form: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="border border-brand-border rounded-xl p-4 space-y-3 bg-brand-cream/30">
      <h4 className="text-xs font-bold text-brand-forest uppercase tracking-wider">{label}</h4>
      <div className="grid grid-cols-1 gap-2">
        <input
          placeholder="Name / Vendor"
          value={form[`${prefix}Name`] || ""}
          onChange={e => onChange(`${prefix}Name`, e.target.value)}
          className="h-9 px-3 text-sm bg-white border border-brand-border rounded-lg outline-none focus:ring-1 focus:ring-brand-sage w-full"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted text-xs">₹</span>
            <input
              type="number"
              placeholder="0"
              min={0}
              value={form[`${prefix}Cost`] ?? ""}
              onChange={e => onChange(`${prefix}Cost`, e.target.value)}
              className="h-9 pl-6 pr-3 text-sm bg-white border border-brand-border rounded-lg outline-none focus:ring-1 focus:ring-brand-sage w-full"
            />
          </div>
          <select
            value={form[`${prefix}PaymentStatus`] || "PENDING"}
            onChange={e => onChange(`${prefix}PaymentStatus`, e.target.value)}
            className="h-9 px-2 text-xs bg-white border border-brand-border rounded-lg outline-none flex-shrink-0"
          >
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={form[`${prefix}PaymentMode`] || ""}
            onChange={e => onChange(`${prefix}PaymentMode`, e.target.value || null)}
            className="h-9 px-2 text-xs bg-white border border-brand-border rounded-lg outline-none flex-shrink-0"
          >
            <option value="">Mode</option>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

export function PurchaseDrawer({
  purchase,
  onClose,
  onSaved,
}: {
  purchase: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setForm({ ...purchase });
  }, [purchase]);

  const billValue = toNum(purchase.billValue);
  const live = computeLive(form, billValue);

  function set(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["purchases"] });
      const previous = queryClient.getQueryData<any>(["purchases"]);
      if (previous) {
        queryClient.setQueryData<any>(["purchases"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((p: any) => p.id === purchase.id ? { ...p, ...data } : p)
          };
        });
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Purchase record saved.");
      onSaved();
    },
    onError: (err, variables, context: any) => {
      toast.error("Failed to save changes.");
      if (context?.previous) {
        queryClient.setQueryData(["purchases"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    }
  });

  function handleSave() {
    mutation.mutate(form);
  }

  const profitColor = live.profit < 0 ? "text-red-600" : live.pct >= 40 ? "text-green-600" : live.pct >= 20 ? "text-amber-600" : "text-red-500";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="bg-brand-forest text-white p-5 shrink-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded">{purchase.invoiceNumber}</span>
              <h2 className="text-xl font-bold mt-1.5">{purchase.customerName}</h2>
              <p className="text-brand-cream/70 text-sm mt-0.5 line-clamp-1">{purchase.description}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Live Profit Summary */}
          <div className="grid grid-cols-3 gap-3 bg-white/10 rounded-xl p-3 text-xs">
            <div>
              <div className="text-white/60">Bill Value</div>
              <div className="font-bold mt-0.5">{fmt(billValue)}</div>
            </div>
            <div>
              <div className="text-white/60">Total Cost</div>
              <div className="font-bold mt-0.5">{fmt(live.totalCost)}</div>
            </div>
            <div>
              <div className="text-white/60">Live Profit</div>
              <div className={`font-bold mt-0.5 flex items-center gap-1 ${live.profit >= 0 ? "text-green-300" : "text-red-300"}`}>
                {live.profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {fmt(live.profit)}
                <span className="opacity-80">({live.pct.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Lead source */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Lead Source</label>
            <select
              value={form.leadSource || ""}
              onChange={e => set("leadSource", e.target.value || null)}
              className="w-full h-9 px-3 text-sm bg-brand-cream border border-brand-border rounded-lg outline-none focus:ring-1 focus:ring-brand-sage"
            >
              <option value="">Select source…</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Cost breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" /> Cost Breakdown
            </h3>
            <FieldGroup label="Designer 1" prefix="designer1" form={form} onChange={set} />
            <FieldGroup label="Designer 2" prefix="designer2" form={form} onChange={set} />
            <FieldGroup label="Printer 1" prefix="printer1" form={form} onChange={set} />
            <FieldGroup label="Printer 2" prefix="printer2" form={form} onChange={set} />
            <FieldGroup label="Raw Material 1" prefix="rawMaterial1" form={form} onChange={set} />
            <FieldGroup label="Raw Material 2" prefix="rawMaterial2" form={form} onChange={set} />
            <FieldGroup label="Post Processing 1" prefix="postProcess1" form={form} onChange={set} />
            <FieldGroup label="Post Processing 2" prefix="postProcess2" form={form} onChange={set} />
          </div>

          {/* Sub-totals summary */}
          <div className="bg-brand-cream border border-brand-border rounded-xl p-4 space-y-2 text-xs">
            <h4 className="font-bold text-brand-forest uppercase tracking-wider mb-2">Live Cost Summary</h4>
            {[
              ["Design", live.totalDesignerCost],
              ["Printing", live.totalPrinterCost],
              ["Raw Materials", live.totalRawMaterialCost],
              ["Post Processing", live.totalPostProcessCost],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between">
                <span className="text-brand-muted">{label as string}</span>
                <span className="font-semibold text-slate-700">{fmt(val as number)}</span>
              </div>
            ))}
            <div className="border-t border-brand-border pt-2 flex justify-between font-bold text-sm">
              <span>Total Production Cost</span>
              <span>{fmt(live.totalCost)}</span>
            </div>
            <div className={`flex justify-between font-bold text-sm ${profitColor}`}>
              <span>Profit {live.profit < 0 ? "(LOSS)" : ""}</span>
              <span>{fmt(live.profit)} ({live.pct.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-forest uppercase tracking-wider">Notes</label>
            <textarea
              value={form.notes || ""}
              onChange={e => set("notes", e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-brand-cream border border-brand-border rounded-lg outline-none focus:ring-1 focus:ring-brand-sage resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-brand-border bg-brand-cream/30 shrink-0">
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 h-10 border border-brand-border rounded-lg text-sm font-semibold text-brand-muted hover:bg-white transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={mutation.isPending}
              className="flex-1 h-10 bg-brand-forest text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-brand-sage transition-colors disabled:opacity-60">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
