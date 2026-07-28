"use client";

import { useState, useDeferredValue, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Search, Plus, FileText, Eye, CheckCircle, XCircle, Download, Trash2, Calendar, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quotation } from "@/lib/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function QuotationsClient({ initialQuotations }: any) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredStatusFilter = useDeferredValue(statusFilter);

  const [page, setPage] = useState(initialQuotations?.metadata?.page || 1);
  const [cursor, setCursor] = useState<string | null>(null);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

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

  const { data: queryResponse, isLoading: loading, error, refetch: loadQuotations } = useQuery({
    queryKey: ["quotations", page, cursor, direction],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (cursor && direction) {
        params.set("cursor", cursor);
        params.set("direction", direction);
      }
      const res = await fetch(`/api/quotations?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load quotations");
      }
      return json;
    },
    initialData: initialQuotations
  });

  const loadError = error instanceof Error ? error.message : null;
  const rawQuotations = queryResponse?.data || [];
  const metadata = queryResponse?.metadata || { page: 1, limit: 20, totalPages: 1, total: 0 };
  
  const quotations = rawQuotations.filter((item: Quotation) => deferredStatusFilter === "all" || item.status === deferredStatusFilter);

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string, action: 'accept' | 'reject' }) => {
      const res = await fetch(`/api/quotations/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Failed to ${action}`);
      return { id, action, data };
    },
    onMutate: async ({ id, action }) => {
      await queryClient.cancelQueries({ queryKey: ["quotations"] });
      const previous = queryClient.getQueryData<Quotation[]>(["quotations"]);
      if (previous) {
        queryClient.setQueryData<Quotation[]>(["quotations"], old => 
          old ? old.map((q: Quotation) => q.id === id ? { ...q, status: action === 'accept' ? 'accepted' : 'rejected' } : q) : []
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      toast.error(err instanceof Error ? err.message : `Failed to ${variables.action} quotation`);
      if (context?.previous) {
        queryClient.setQueryData(["quotations"], context.previous);
      }
    },
    onSuccess: (data) => {
      toast.success(data.data.message || `Quotation ${data.action}ed successfully`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete");
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["quotations"] });
      const previous = queryClient.getQueryData<Quotation[]>(["quotations"]);
      if (previous) {
        queryClient.setQueryData<Quotation[]>(["quotations"], old => 
          old ? old.filter(q => q.id !== id) : []
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete quotation");
      if (context?.previous) {
        queryClient.setQueryData(["quotations"], context.previous);
      }
    },
    onSuccess: () => {
      toast.success("Quotation deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    }
  });

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    actionMutation.mutate({ id, action });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation? This action cannot be undone.")) return;
    deleteMutation.mutate(id);
  };

  const handleDownload = async (q: Quotation) => {
    try {
      setDownloadingId(q.id);
      const { generateQuotationPdf } = await import("@/lib/pdf/generateQuotationPdf");
      await generateQuotationPdf(q);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredData = quotations.filter((q: any) => {
    if (!deferredSearchTerm) return true;
    const term = deferredSearchTerm.toLowerCase();
    return (
      q.customer_name?.toLowerCase().includes(term) ||
      q.quotation_number?.toLowerCase().includes(term)
    );
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-700 border-gray-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "accepted": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  const tableVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 73, // Approx height of a tr in Quotations
    overscan: 5,
  });

  const mobileVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => mobileContainerRef.current,
    estimateSize: () => 180, // Approx height of a mobile card in Quotations
    overscan: 5,
  });

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isExpired = (validUntil?: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date(new Date().setHours(0,0,0,0));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Quotations</h1>
          <p className="text-sm text-text-secondary mt-1">
            Create and manage customer quotations
          </p>
        </div>
        <Link 
          href="/dashboard/quotations/new"
          className="btn btn-cta flex items-center gap-2 shrink-0"
          data-tour="quo-new"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>New Quotation</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by customer or QUO number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-sm transition-all text-text-primary bg-white"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border rounded-lg whitespace-nowrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden flex flex-col" data-tour="quo-list">
        <div ref={tableContainerRef} className="overflow-auto max-h-[650px] min-h-[400px]">
          {/* Desktop Table */}
          <table className="w-full text-sm text-left hidden md:table">
            <thead className="bg-table-header text-text-secondary font-medium border-b border-card-border">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Quotation No</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Items</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Amount</th>
                <th className="px-6 py-4 whitespace-nowrap">Valid Until</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-white text-text-primary relative">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-slate-100">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                      <div className="h-3 bg-slate-100 rounded w-48"></div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : loadError ? (
                <tr>
                  <td colSpan={7}>
                    <ErrorState message={loadError} onRetry={loadQuotations} />
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <EmptyState
                      icon={FileText}
                      title="No quotations found"
                      description={searchTerm || statusFilter !== "all"
                        ? "Try adjusting your filters to find what you're looking for."
                        : "You haven't created any quotations yet. Start by creating your first one."}
                      actionLabel={!searchTerm && statusFilter === "all" ? "New Quotation" : undefined}
                      actionHref={!searchTerm && statusFilter === "all" ? "/dashboard/quotations/new" : undefined}
                      compact={true}
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {tableVirtualizer.getVirtualItems().length > 0 && (
                    <tr><td colSpan={7} style={{ height: tableVirtualizer.getVirtualItems()[0].start }} /></tr>
                  )}
                  {tableVirtualizer.getVirtualItems().map((virtualRow) => {
                    const q = filteredData[virtualRow.index];
                    const rowStyle = q.status === 'accepted' ? 'bg-green-50/40 hover:bg-green-50' : q.status === 'rejected' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-table-hover';
                    return (
                    <tr key={q.id} data-index={virtualRow.index} ref={tableVirtualizer.measureElement} className={`${rowStyle} transition-colors group`}>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-primary font-mono">
                      {q.quotation_number || "Draft"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary">{q.customer_name}</div>
                      {q.customer_email && <div className="text-xs text-text-muted mt-0.5">{q.customer_email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                      {Array.isArray(q.items) ? q.items.length : 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold font-mono">
                      ₹{Number(q.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {q.valid_until ? (
                        <div className={`flex items-center gap-1.5 font-mono ${isExpired(q.valid_until) ? 'text-danger font-medium' : 'text-text-secondary'}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(q.valid_until), "dd MMM yyyy")}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(q.status)}`}>
                        {getStatusLabel(q.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <Link 
                          href={`/dashboard/quotations/${q.id}`}
                          className="p-1.5 text-text-secondary hover:text-primary hover:bg-slate-100 rounded-md transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button 
                          onClick={() => handleDownload(q)}
                          disabled={downloadingId === q.id}
                          className="p-1.5 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          {downloadingId === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        
                        {q.status === 'accepted' ? (
                           <Link 
                              href={q.invoice_id ? `/dashboard/invoices/${q.invoice_id}` : `/dashboard/invoices`} 
                              className="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold rounded transition-colors ml-1"
                           >
                              View Invoice →
                           </Link>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleAction(q.id, 'accept')}
                              className="p-1.5 text-text-secondary hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                              title="Accept Quotation"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAction(q.id, 'reject')}
                              className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                              title="Reject Quotation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(q.id)}
                              className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Quotation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {tableVirtualizer.getVirtualItems().length > 0 && (
                  <tr><td colSpan={7} style={{ height: tableVirtualizer.getTotalSize() - tableVirtualizer.getVirtualItems()[tableVirtualizer.getVirtualItems().length - 1].end }} /></tr>
                )}
                </>
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div ref={mobileContainerRef} className="md:hidden overflow-y-auto max-h-[600px] flex flex-col divide-y divide-card-border relative">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 space-y-3 animate-pulse">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded w-32"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))
            ) : loadError ? (
              <div className="p-4">
                <ErrorState message={loadError} onRetry={loadQuotations} />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={FileText}
                  title="No quotations found"
                  description={searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters to find what you're looking for."
                    : "You haven't created any quotations yet. Start by creating your first one."}
                  actionLabel={!searchTerm && statusFilter === "all" ? "New Quotation" : undefined}
                  actionHref={!searchTerm && statusFilter === "all" ? "/dashboard/quotations/new" : undefined}
                  compact={true}
                />
              </div>
            ) : (
              <>
                {mobileVirtualizer.getVirtualItems().length > 0 && (
                  <div style={{ height: mobileVirtualizer.getVirtualItems()[0].start }} />
                )}
                {mobileVirtualizer.getVirtualItems().map((virtualRow) => {
                  const q = filteredData[virtualRow.index];
                  return (
                  <div key={q.id} data-index={virtualRow.index} ref={mobileVirtualizer.measureElement} className="p-4 flex flex-col gap-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-primary font-mono block">{q.quotation_number || "Draft"}</span>
                      <span className="font-medium text-text-primary text-base">{q.customer_name}</span>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(q.status)}`}>
                      {getStatusLabel(q.status)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-text-secondary">
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold font-mono text-text-primary">
                        ₹{Number(q.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span>{Array.isArray(q.items) ? q.items.length : 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valid Until:</span>
                      <span className={isExpired(q.valid_until) ? 'text-danger font-medium' : ''}>
                        {q.valid_until ? format(new Date(q.valid_until), "dd MMM yyyy") : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                    <Link 
                      href={`/dashboard/quotations/${q.id}`}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => handleDownload(q)}
                      disabled={downloadingId === q.id}
                      className="p-2 text-text-secondary hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                    >
                      {downloadingId === q.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    </button>
                    {q.status === 'accepted' ? (
                       <Link 
                          href={q.invoice_id ? `/dashboard/invoices/${q.invoice_id}` : `/dashboard/invoices`} 
                          className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 text-sm font-semibold rounded-lg transition-colors ml-1"
                       >
                          View Invoice
                       </Link>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAction(q.id, 'accept')}
                          className="p-2 text-text-secondary hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleAction(q.id, 'reject')}
                          className="p-2 text-text-secondary hover:text-danger hover:bg-red-50 rounded-md transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )})}
                {mobileVirtualizer.getVirtualItems().length > 0 && (
                  <div style={{ height: mobileVirtualizer.getTotalSize() - mobileVirtualizer.getVirtualItems()[mobileVirtualizer.getVirtualItems().length - 1].end }} />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Pagination placeholder if needed */}
        {filteredData.length > 0 && !loading && (
          <div className="px-6 py-4 border-t border-card-border bg-slate-50 flex items-center justify-between">
            <button 
              onClick={() => {
                const firstQ = filteredData[0];
                handlePageChange(Math.max(1, page - 1), firstQ?.id, "prev");
              }}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-semibold border border-brand-border rounded hover:bg-brand-cream disabled:opacity-50 text-brand-forest transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-bold text-brand-black">Page <span className="text-brand-forest">{page}</span> of {metadata.totalPages || 1}</span>
            <button 
              onClick={() => {
                const lastQ = filteredData[filteredData.length - 1];
                handlePageChange(Math.min(metadata.totalPages || 1, page + 1), lastQ?.id, "next");
              }}
              disabled={page === (metadata.totalPages || 1)}
              className="px-4 py-2 text-sm font-semibold border border-brand-border rounded hover:bg-brand-cream disabled:opacity-50 text-brand-forest transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
