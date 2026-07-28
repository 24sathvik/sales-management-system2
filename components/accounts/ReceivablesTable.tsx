/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function MarkPaidModal({ invoice, isPartial, onClose, onSaved }: { invoice: any; isPartial: boolean; onClose: () => void; onSaved: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    amount: isPartial ? "" : String(invoice.balance || 0),
    mode: "CASH",
    date: new Date().toISOString().slice(0, 10),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const parsedAmount = Number(data.amount);
      if (parsedAmount > Number(invoice.balance)) {
        throw new Error("Amount cannot exceed remaining balance");
      }
      const res = await fetch("/api/accounts/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREDIT",
          mode: data.mode,
          amount: data.amount,
          date: data.date,
          description: `Balance payment for ${invoice.invoiceNumber}`,
          invoiceNumber: invoice.invoiceNumber,
          invoiceId: invoice.id,
          category: "INVOICE_BALANCE",
        }),
      });
      if (!res.ok) throw new Error("Payment transaction failed");
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["accounts-receivables"] });
      const previous = queryClient.getQueryData<any[]>(["accounts-receivables"]);
      if (previous) {
        queryClient.setQueryData<any[]>(["accounts-receivables"], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            invoices: old.invoices.map((inv: any) => inv.id === invoice.id ? { ...inv, balance: Math.max(0, Number(inv.balance) - Number(data.amount)) } : inv)
          };
        });
      }
      return { previous };
    },
    onSuccess: () => { toast.success("Payment recorded."); onSaved(); },
    onError: (err, data, context: any) => {
      toast.error(err instanceof Error ? err.message : "Failed to record payment.");
      if (context?.previous) {
        queryClient.setQueryData(["accounts-receivables"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts-receivables"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
      queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 animate-in zoom-in-95 duration-150">
        <div className="bg-green-600 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-bold">Mark Balance as Paid</h3>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="font-semibold text-green-800">{invoice.invoiceNumber} — {invoice.customerName}</p>
            <p className="text-green-600 text-xs mt-1">Balance Due: <strong>{fmt(Number(invoice.balance))}</strong></p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Amount Received (₹) {isPartial && "(Up to limit)"}</label>
            <input type="number" min={1} max={Number(invoice.balance)} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none">
                {["CASH", "ONLINE", "UPI"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg outline-none" />
            </div>
          </div>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.amount}
            className="w-full h-11 bg-green-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReceivablesTable({ data }: { data: any }) {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<{ invoice: any, isPartial: boolean } | null>(null);

  const invoices: any[] = data?.invoices || [];
  const totalReceivable = data?.totalReceivable || 0;

  const today = new Date();

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const tableVirtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 57, // Approx height of a tr in Receivables
    overscan: 5,
  });

  const mobileVirtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => mobileContainerRef.current,
    estimateSize: () => 180, // Approx height of a mobile card in Receivables
    overscan: 5,
  });

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-brand-border">
        <div>
          <h2 className="text-base font-bold text-brand-forest">Pending Receivables</h2>
          <p className="text-xs text-brand-muted mt-0.5">Outstanding balances from active invoices</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-muted">Total Outstanding</p>
          <p className="text-xl font-bold text-red-600 font-mono">{fmt(totalReceivable)}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center text-brand-muted text-sm flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 opacity-30" />
          <p>No outstanding balances. All invoices are settled! 🎉</p>
        </div>
      ) : (
        <div ref={tableContainerRef} className="overflow-auto max-h-[600px]">
          {/* Desktop Table */}
          <table className="w-full text-sm hidden md:table relative" style={{ minWidth: "800px" }}>
            <thead className="bg-brand-cream text-brand-forest">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Invoice</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Phone</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Total Bill</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Advance Paid</th>
                <th className="px-4 py-2.5 text-right text-xs font-bold">Balance Due</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Due Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Assignee</th>
                <th className="px-4 py-2.5 text-left text-xs font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {tableVirtualizer.getVirtualItems().length > 0 && (
                <tr><td colSpan={9} style={{ height: tableVirtualizer.getVirtualItems()[0].start }} /></tr>
              )}
              {tableVirtualizer.getVirtualItems().map((virtualRow) => {
                const inv = invoices[virtualRow.index];
                const dueDate = inv.finalDeliveryDate ? new Date(inv.finalDeliveryDate) : null;
                const isOverdue = dueDate && dueDate < today;
                return (
                  <tr key={inv.id} data-index={virtualRow.index} ref={tableVirtualizer.measureElement} className={`border-t border-brand-border/40 transition-colors ${isOverdue ? "bg-red-50/30 hover:bg-red-50/60" : "hover:bg-brand-cream/20"}`}>
                    <td className="px-4 py-2.5 font-mono font-bold text-xs text-brand-forest">
                      {`INV-${String(inv.invoiceNumber).padStart(4, "0")}`}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-semibold max-w-[140px] truncate" title={inv.customerName}>{inv.customerName}</td>
                    <td className="px-4 py-2.5 text-xs text-brand-muted font-mono">{inv.phone || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold font-mono">{fmt(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-green-600 font-mono">{fmt(Number(inv.advanceAmount || 0))}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-red-600 font-mono">{fmt(Number(inv.balance || 0))}</td>
                    <td className="px-4 py-2.5 text-xs">
                      {dueDate ? (
                        <span className={`font-mono ${isOverdue ? "text-red-600 font-bold" : "text-brand-muted"}`}>
                          {format(dueDate, "dd MMM yyyy")}
                          {isOverdue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded-full">OVERDUE</span>}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-brand-muted">{inv.assignee?.name || "—"}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button onClick={() => setModalState({ invoice: inv, isPartial: true })}
                          className="px-2 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[10px] font-bold rounded-lg transition-colors whitespace-nowrap">
                          Partial Pay
                        </button>
                        <button onClick={() => setModalState({ invoice: inv, isPartial: false })}
                          className="px-2 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                          Full Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tableVirtualizer.getVirtualItems().length > 0 && (
                <tr><td colSpan={9} style={{ height: tableVirtualizer.getTotalSize() - tableVirtualizer.getVirtualItems()[tableVirtualizer.getVirtualItems().length - 1].end }} /></tr>
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div ref={mobileContainerRef} className="md:hidden overflow-y-auto max-h-[600px] flex flex-col divide-y divide-brand-border/40 relative">
             {mobileVirtualizer.getVirtualItems().length > 0 && (
               <div style={{ height: mobileVirtualizer.getVirtualItems()[0].start }} />
             )}
             {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
               const inv = invoices[virtualRow.index];
               const dueDate = inv.finalDeliveryDate ? new Date(inv.finalDeliveryDate) : null;
               const isOverdue = dueDate && dueDate < today;
               return (
                  <div key={inv.id} data-index={virtualRow.index} ref={mobileVirtualizer.measureElement} className={`p-4 flex flex-col gap-2 transition-colors border-l-4 ${isOverdue ? "bg-red-50/10 border-l-red-500" : "border-l-transparent hover:bg-slate-50"}`}>
                    <div className="flex justify-between items-start">
                       <div>
                          <span className="font-bold text-brand-forest font-mono text-sm">
                             {`INV-${String(inv.invoiceNumber).padStart(4, "0")}`}
                          </span>
                          <div className="text-sm font-semibold text-slate-800">{inv.customerName}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] text-brand-muted uppercase tracking-wider font-bold">Balance Due</div>
                          <div className="font-bold text-red-600 text-lg font-mono leading-tight">{fmt(Number(inv.balance || 0))}</div>
                       </div>
                    </div>
                    
                    <div className="flex justify-between text-xs mt-1">
                       <span className="text-brand-muted">Total: <span className="font-mono font-medium text-slate-700">{fmt(Number(inv.totalAmount))}</span></span>
                       <span className="text-brand-muted">Adv: <span className="font-mono font-medium text-green-600">{fmt(Number(inv.advanceAmount || 0))}</span></span>
                    </div>

                    <div className="flex justify-between text-xs mt-1 bg-brand-cream/30 p-2 rounded-md">
                       <div className="flex flex-col">
                          <span className="text-[10px] text-brand-muted font-bold uppercase">Due Date</span>
                          {dueDate ? (
                             <span className={`font-mono font-semibold ${isOverdue ? "text-red-600" : "text-slate-700"}`}>
                                {format(dueDate, "dd MMM yyyy")}
                                {isOverdue && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 rounded-full">OVERDUE</span>}
                             </span>
                          ) : "—"}
                       </div>
                       <div className="flex flex-col text-right">
                          <span className="text-[10px] text-brand-muted font-bold uppercase">Assignee</span>
                          <span className="font-medium text-slate-700">{inv.assignee?.name || "—"}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-100">
                       <button onClick={() => setModalState({ invoice: inv, isPartial: true })}
                          className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-[11px] font-bold rounded-lg transition-colors text-center">
                          PARTIAL PAY
                       </button>
                       <button onClick={() => setModalState({ invoice: inv, isPartial: false })}
                          className="flex-1 py-2 bg-green-600 text-white text-[11px] font-bold rounded-lg hover:bg-green-700 transition-colors text-center">
                          FULL PAY
                       </button>
                    </div>
                  </div>
               );
             })}
             {mobileVirtualizer.getVirtualItems().length > 0 && (
               <div style={{ height: mobileVirtualizer.getTotalSize() - mobileVirtualizer.getVirtualItems()[mobileVirtualizer.getVirtualItems().length - 1].end }} />
             )}
             <div className="p-4 border-t-2 border-red-200 bg-red-50/30 flex justify-between items-center">
                <span className="text-sm font-bold text-red-700">Total Receivable</span>
                <span className="font-bold text-red-700 text-lg font-mono">{fmt(totalReceivable)}</span>
             </div>
          </div>
        </div>
      )}

      {modalState && (
        <MarkPaidModal invoice={modalState.invoice} isPartial={modalState.isPartial} onClose={() => setModalState(null)} onSaved={() => {
          setModalState(null);
          queryClient.invalidateQueries({ queryKey: ["accounts-receivables"] });
          queryClient.invalidateQueries({ queryKey: ["accounts-transactions"] });
          queryClient.invalidateQueries({ queryKey: ["accounts-summary"] });
        }} />
      )}
    </div>
  );
}
