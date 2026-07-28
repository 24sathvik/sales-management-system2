/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { differenceInDays, startOfDay, format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { AdvancedFilterPanel } from "./AdvancedFilterPanel";
import { ChevronUp, ChevronDown, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { useVirtualizer } from "@tanstack/react-virtual";


function DownloadAction({ invoice }: { invoice: any }) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const { generateInvoicePdf } = await import("@/lib/pdf/generateInvoicePdf");
      
      const pdfData = {
        ...invoice,
        customerName: invoice.customerName || "",
        phone: invoice.phone || "",
        description: invoice.description || "",
        packing: invoice.packing || "WITHOUT_PACKING",
        advancePaid: invoice.advancePaid || false,
        quantity: Number(invoice.quantity || 0),
        unitRate: Number(invoice.unitRate || 0),
        invoiceNumber: `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`,
      };
      
      await generateInvoicePdf(pdfData);
    } catch(err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={download} disabled={loading} className="text-brand-forest hover:text-brand-sage p-1" title="Download PDF">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
    </button>
  );
}

const getRowStyle = (dateStr: string | null, status: string) => {
  if (!dateStr || status !== "ACTIVE") return { row: "bg-white", text: "text-slate-900" };

  const finalDate = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  const diff = differenceInDays(finalDate, today);

  if (diff < 0) {
    return { row: "bg-white", text: "text-red-600 font-bold" };
  } else if (diff >= 0 && diff <= 2) {
    return { row: "bg-red-100", text: "text-slate-900" };
  } else if (diff >= 3 && diff <= 6) {
    return { row: "bg-amber-100", text: "text-slate-900" };
  } else if (diff >= 7 && diff <= 14) {
    return { row: "bg-yellow-100", text: "text-slate-900" };
  } else {
    return { row: "bg-green-100", text: "text-slate-900" };
  }
};

export function InvoiceTable({ currentUserRole, initialData }: { currentUserRole: string, initialData?: any }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sortBy = searchParams.get("sortBy") || "finalDeliveryDate";
  const order = searchParams.get("order") || "asc";

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const setPage = (newPage: number, cursor?: string, direction?: "next" | "prev") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    if (cursor && direction) {
      params.set("cursor", cursor);
      params.set("direction", direction);
    } else {
      params.delete("cursor");
      params.delete("direction");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleSort = (field: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === field) {
      params.set("order", order === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", field);
      params.set("order", "asc"); // Default asc for new field
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : (json.data || []);
    },
    staleTime: 60000,
  });

  const queryKey = ["invoices", searchParams.toString()];
  
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams(searchParams.toString());
      if (!params.has("page")) params.set("page", "1");
      if (!params.has("limit")) params.set("limit", "20");
      if (!params.has("sortBy")) params.set("sortBy", "finalDeliveryDate");
      if (!params.has("order")) params.set("order", "asc");
      if (!params.has("status")) params.set("status", "ALL");
      
      const res = await fetch(`/api/invoices?${params.toString()}`, { cache: "no-store", headers: { 'Cache-Control': 'no-cache' } });
      if (!res.ok) throw new Error("Failed to load invoices");
      return res.json();
    },
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey) as any;
      if (previousData) {
        queryClient.setQueryData(queryKey, {
          ...previousData,
          data: previousData.data.filter((inv: any) => inv.id !== id),
        });
      }
      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error("Failed to delete invoice.");
    },
    onSuccess: () => {
      toast.success("Invoice deleted successfully");
      setDeleteId(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const invoices = data?.data || [];
  const totalPages = data?.metadata?.totalPages || 1;

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return order === "asc" ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const tableVirtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53, // Approx height of a tr
    overscan: 5,
  });

  const mobileVirtualizer = useVirtualizer({
    count: invoices.length,
    getScrollElement: () => mobileContainerRef.current,
    estimateSize: () => 200, // Approx height of a mobile card
    overscan: 5,
  });

  return (
    <div className="space-y-4 font-sans tour-invoices" data-tour="inv-list">
      
      <div className="flex justify-end mb-2 tour-i-legend">
        <div className="flex gap-2 text-xs items-center bg-white p-2 rounded border shadow-sm font-medium">
          <span className="font-bold text-brand-black mr-2">Priority Legend:</span>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-red-100 border"></span> 0-2 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-amber-100 border"></span> 3-6 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-yellow-100 border"></span> 7-14 Days</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-green-100 border"></span> 15+ Days</div>
          <div className="flex items-center gap-1 ml-2 text-red-600 font-bold tracking-tight">Past Deadline</div>
        </div>
      </div>

      <div className="tour-i-filters">
        <AdvancedFilterPanel users={Array.isArray(usersData) ? usersData : (usersData?.data || [])} />
      </div>

      {/* Table & Mobile Cards Wrapper */}
      <div className="bg-white rounded-lg border border-brand-border shadow-sm overflow-hidden flex flex-col">
        {/* Desktop Table */}
        <div ref={tableContainerRef} className="overflow-auto max-h-[650px] min-h-[400px]">
          <table className="w-full text-sm text-left hidden md:table">
          <thead className="text-xs text-brand-forest uppercase bg-brand-cream/30 border-b border-brand-border">
            <tr>
              <th className="px-4 py-3">S.No</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-brand-cream/60 transition-colors" onClick={() => handleSort("invoiceNumber")}>
                Invoice No <SortIcon field="invoiceNumber" />
              </th>
              <th className="px-4 py-3 cursor-pointer hover:bg-brand-cream/60 transition-colors" onClick={() => handleSort("customerName")}>
                Customer <SortIcon field="customerName" />
              </th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-brand-cream/60 transition-colors" onClick={() => handleSort("category")}>
                Category <SortIcon field="category" />
              </th>
              <th className="px-4 py-3 whitespace-nowrap">Qty</th>
              <th className="px-4 py-3 whitespace-nowrap">Specifications</th>
              <th className="px-4 py-3">Assigned Staff</th>
              <th className="px-4 py-3">Vendor / Executor</th>
              <th className="px-4 py-3 whitespace-nowrap">Confirmed On</th>
              <th className="px-4 py-3 cursor-pointer hover:bg-brand-cream/60 transition-colors whitespace-nowrap" onClick={() => handleSort("finalDeliveryDate")}>
                Delivery Date <SortIcon field="finalDeliveryDate" />
              </th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-8"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-32"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  <td className="px-4 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-8">
                  <EmptyState 
                    icon={FileText} 
                    title={searchParams.keys().next().done ? "No invoices found" : "No results found"}
                    description={searchParams.keys().next().done ? "You haven't created any invoices yet. Create your first invoice to get started." : "No invoices match your active filters. Try adjusting your search."}
                    actionLabel={searchParams.keys().next().done ? "Create Invoice" : undefined}
                    actionHref="/dashboard/invoices/new"
                    compact={true}
                  />
                </td>
              </tr>
            ) : (
              <>
                {tableVirtualizer.getVirtualItems().length > 0 && (
                  <tr><td colSpan={13} style={{ height: tableVirtualizer.getVirtualItems()[0].start }} /></tr>
                )}
                {tableVirtualizer.getVirtualItems().map((virtualRow) => {
                  const inv = invoices[virtualRow.index];
                  const index = virtualRow.index;
                const style = getRowStyle(inv.finalDeliveryDate, inv.status);
                return (
                  <tr key={inv.id} data-index={virtualRow.index} ref={tableVirtualizer.measureElement} className={`border-b border-brand-border hover:opacity-90 transition-colors ${style.row}`}>
                    <td className="px-4 py-3 font-medium text-brand-muted">{(page - 1) * limit + index + 1}</td>
                    <td className="px-4 py-3 font-bold text-brand-forest font-mono">
                      INV-{String(inv.invoiceNumber).padStart(4, "0")}
                      {inv.status === "CLOSED" && <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 font-sans">Closed</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-black">{inv.customerName}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-brand-black" title={inv.description}>{inv.description}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-cream/80 text-brand-forest border border-brand-border">{inv.category || "Uncategorized"}</span></td>
                    <td className="px-4 py-3 font-medium">{inv.quantity}</td>
                    <td className="px-4 py-3">{inv.printingColor || "-"}</td>
                    <td className="px-4 py-3">{inv.designer || "-"}</td>
                    <td className="px-4 py-3">{inv.printer || "-"}</td>
                    <td className="px-4 py-3 font-mono">{inv.contentConfirmedOn ? format(new Date(inv.contentConfirmedOn), "dd MMM yyyy") : "-"}</td>
                    <td className={`px-4 py-3 font-semibold font-mono ${style.text}`}>{inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM yyyy") : "-"}</td>
                    <td className="px-4 py-3 font-medium text-brand-black">{inv.assignee?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/invoices/${inv.id}/edit`} className="text-brand-sage hover:text-brand-forest p-1 transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DownloadAction invoice={inv} />
                        {currentUserRole === "ADMIN" && (
                          <button 
                            onClick={() => setDeleteId(inv.id)} 
                            className="text-brand-danger hover:text-red-700 p-1 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
                {tableVirtualizer.getVirtualItems().length > 0 && (
                  <tr><td colSpan={13} style={{ height: tableVirtualizer.getTotalSize() - tableVirtualizer.getVirtualItems()[tableVirtualizer.getVirtualItems().length - 1].end }} /></tr>
                )}
              </>
            )}
          </tbody>
        </table>
        </div>

        {/* Mobile Cards */}
        <div ref={mobileContainerRef} className="md:hidden overflow-y-auto max-h-[600px] flex flex-col divide-y divide-brand-border relative">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="h-4 bg-slate-200 rounded w-24"></div>
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-slate-200 rounded w-32"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))
          ) : invoices.length === 0 ? (
            <div className="p-8">
              <EmptyState 
                icon={FileText} 
                title={searchParams.keys().next().done ? "No invoices found" : "No results found"}
                description={searchParams.keys().next().done ? "You haven't created any invoices yet. Create your first invoice to get started." : "No invoices match your active filters. Try adjusting your search."}
                actionLabel={searchParams.keys().next().done ? "Create Invoice" : undefined}
                actionHref="/dashboard/invoices/new"
                compact={true}
              />
            </div>
          ) : (
            <>
              {mobileVirtualizer.getVirtualItems().length > 0 && (
                <div style={{ height: mobileVirtualizer.getVirtualItems()[0].start }} />
              )}
              {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
                const inv = invoices[virtualRow.index];
                const index = virtualRow.index;
                const style = getRowStyle(inv.finalDeliveryDate, inv.status);
                return (
                  <div key={inv.id} data-index={virtualRow.index} ref={mobileVirtualizer.measureElement} className={`p-4 flex flex-col gap-3 transition-colors ${style.row === 'bg-white' ? 'hover:bg-slate-50' : style.row}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-brand-forest font-mono block">
                        INV-{String(inv.invoiceNumber).padStart(4, "0")}
                        {inv.status === "CLOSED" && <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700 font-sans">Closed</span>}
                      </span>
                      <span className="font-medium text-brand-black text-base">{inv.customerName}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-cream/80 text-brand-forest border border-brand-border">
                      {inv.category || "Uncategorized"}
                    </span>
                  </div>
                  
                  {inv.description && (
                    <div className="text-sm text-brand-black opacity-80 line-clamp-2">
                      {inv.description}
                    </div>
                  )}

                  <div className="flex flex-col gap-1 text-sm text-brand-muted mt-1">
                    <div className="flex justify-between">
                      <span>Delivery Date:</span>
                      <span className={`font-semibold font-mono ${style.text}`}>
                        {inv.finalDeliveryDate ? format(new Date(inv.finalDeliveryDate), "dd MMM yyyy") : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Qty:</span>
                      <span className="font-medium text-brand-black">{inv.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assignee:</span>
                      <span className="text-brand-black">{inv.assignee?.name || "-"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-brand-border/50">
                    <Link href={`/dashboard/invoices/${inv.id}/edit`} className="p-2 bg-slate-100 text-brand-sage hover:text-brand-forest rounded-md transition-colors" title="Edit">
                      <Pencil className="w-5 h-5" />
                    </Link>
                    <div className="p-1 bg-slate-100 rounded-md">
                      <DownloadAction invoice={inv} />
                    </div>
                    {currentUserRole === "ADMIN" && (
                      <button 
                        onClick={() => setDeleteId(inv.id)} 
                        className="p-2 bg-red-50 text-brand-danger hover:text-red-700 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
              {mobileVirtualizer.getVirtualItems().length > 0 && (
                <div style={{ height: mobileVirtualizer.getTotalSize() - mobileVirtualizer.getVirtualItems()[mobileVirtualizer.getVirtualItems().length - 1].end }} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && invoices.length > 0 && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-brand-border shadow-sm">
          <button 
            onClick={() => {
              const firstInvoice = invoices[0];
              setPage(Math.max(1, page - 1), firstInvoice?.id, "prev");
            }}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-semibold border border-brand-border rounded hover:bg-brand-cream disabled:opacity-50 text-brand-forest transition-colors"
          >
            Previous
          </button>
          <span className="text-sm font-bold text-brand-black">Page <span className="text-brand-forest">{page}</span> of {totalPages}</span>
          <button 
            onClick={() => {
              const lastInvoice = invoices[invoices.length - 1];
              setPage(Math.min(totalPages, page + 1), lastInvoice?.id, "next");
            }}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-semibold border border-brand-border rounded hover:bg-brand-cream disabled:opacity-50 text-brand-forest transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold mb-2 text-brand-forest">Delete Invoice</h3>
            <p className="text-sm text-brand-muted mb-6">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-semibold border border-brand-border rounded-md hover:bg-brand-cream text-brand-black transition-colors"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deleteId)}
                className="px-4 py-2 text-sm font-semibold bg-brand-danger text-white rounded-md hover:bg-brand-danger/90 disabled:opacity-50 transition-colors"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
