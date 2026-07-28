"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Download, Edit, Loader2, Play, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Quotation } from "@/lib/types";
import { format } from "date-fns";
import QuotationPDFDownloadButton from "@/components/quotations/QuotationPDFDownloadButton";

export default function ViewQuotationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadQuotation();
  }, [params.id]);

  const loadQuotation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${params.id}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        toast.error("Failed to load quotation");
        router.push('/dashboard/quotations');
      } else {
        setQuotation(json.data);
      }
    } catch (err) {
      toast.error("Failed to load quotation");
      router.push('/dashboard/quotations');
    }
    setLoading(false);
  };

  // Replaced with QuotationPDFDownloadButton

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/quotations/${params.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to process acceptance");
      
      const invoiceId = data.data?.invoice_id;
      toast.success(`✅ Quotation accepted & Invoice generated!`, {
        action: invoiceId ? {
          label: "View Invoice →",
          onClick: () => router.push(`/dashboard/invoices/${invoiceId}`)
        } : undefined
      });
      setShowAcceptModal(false);
      loadQuotation();
    } catch (err: any) {
      toast.error(err.message || "Failed to process acceptance");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirm("Are you sure you want to reject this quotation?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/quotations/${params.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to reject quotation");

      toast.success("Quotation marked as rejected.");
      loadQuotation();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject quotation.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  if (!quotation) return null;

  const items = Array.isArray(quotation.items) ? quotation.items : [];
  const subtotal = items.reduce((acc: number, item: any) => acc + (Number(item.qty)*Number(item.unit_price)), 0);

  const getBadgeColors = (status: string) => {
    if(status === 'accepted') return 'bg-green-100 text-green-700 border-green-200';
    if(status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
    if(status === 'sent') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-card-border">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/quotations')} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
             <h1 className="text-2xl font-bold text-primary font-mono">{quotation.quotation_number || "Draft"}</h1>
             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getBadgeColors(quotation.status)}`}>
               {quotation.status}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['draft', 'sent'].includes(quotation.status) && (
            <button 
              onClick={() => router.push(`/dashboard/quotations/${quotation.id}/edit`)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-text-secondary hover:text-primary hover:bg-slate-100 border rounded-lg text-sm font-semibold transition-colors"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
          )}

          <QuotationPDFDownloadButton quotationData={quotation} />

          {['draft', 'sent'].includes(quotation.status) && (
            <>
              <button 
                onClick={handleReject}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-danger hover:bg-red-50 border border-slate-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              
              <button 
                onClick={() => setShowAcceptModal(true)}
                disabled={isProcessing}
                className="btn btn-cta gap-2 px-4 py-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
            </>
          )}

          {quotation.status === 'accepted' && quotation.invoices?.invoice_number && (
             <button 
               onClick={() => router.push(`/dashboard/invoices/${quotation.invoice_id}`)}
               className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg text-sm font-semibold transition-colors"
             >
               View Invoice <Play className="w-3.5 h-3.5" />
             </button>
          )}
        </div>
      </div>

      {/* Main View */}
      <div className="bg-white border text-text-primary border-card-border rounded-xl shadow-sm p-8">
         <div className="flex justify-between items-start mb-12">
            <div>
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</h3>
               <div className="font-bold text-lg text-primary">{quotation.customer_name}</div>
               {quotation.customer_phone && <div className="text-text-secondary mt-1 font-mono">{quotation.customer_phone}</div>}
               {quotation.customer_email && <div className="text-text-secondary mt-1">{quotation.customer_email}</div>}
               {quotation.customer_address && <div className="text-text-secondary mt-2 max-w-xs">{quotation.customer_address}</div>}
            </div>
            <div className="text-right">
               <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Details</div>
               <div className="text-text-secondary mb-1">
                 Date: <span className="font-medium text-text-primary font-mono">{format(new Date(quotation.created_at || new Date()), "dd MMM yyyy")}</span>
               </div>
               <div className="text-sm text-text-secondary flex justify-between">
                 Valid Until: <span className="font-medium text-text-primary font-mono">{quotation.valid_until ? format(new Date(quotation.valid_until), "dd MMM yyyy") : "—"}</span>
               </div>
            </div>
         </div>

         {/* Items Table */}
         <div className="overflow-x-auto mb-8">
           <table className="w-full text-sm text-left">
             <thead className="bg-slate-50 text-slate-500 font-bold border-b border-t border-slate-200 uppercase tracking-wider text-[10px]">
               <tr>
                 <th className="px-4 py-3">#</th>
                 <th className="px-4 py-3">Description</th>
                 <th className="px-4 py-3">Category</th>
                 <th className="px-4 py-3 text-center">Qty</th>
                 <th className="px-4 py-3 text-right">Unit Price</th>
                 <th className="px-4 py-3 text-right">Total</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {items.map((item: any, i: number) => (
                 <tr key={i}>
                   <td className="px-4 py-3 text-slate-400 font-medium">{i + 1}</td>
                   <td className="px-4 py-3 font-medium text-primary">{item.description}</td>
                   <td className="px-4 py-3 text-text-secondary">{item.category}</td>
                   <td className="px-4 py-3 text-center font-medium">{item.qty}</td>
                   <td className="px-4 py-3 text-right text-text-secondary font-mono">₹{Number(item.unit_price).toFixed(2)}</td>
                   <td className="px-4 py-3 text-right font-bold text-primary font-mono">₹{(Number(item.qty)*Number(item.unit_price)).toFixed(2)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>

         {/* Totals */}
         <div className="flex justify-end mb-8">
            <div className="w-72 space-y-3">
               <div className="flex justify-between items-center text-sm py-2">
                  <span>Subtotal</span>
                  <span className="font-medium text-text-primary font-mono">₹{subtotal.toFixed(2)}</span>
               </div>
               {/* Simplified total rendering mirroring creation */}
               <div className="flex justify-between items-center py-3 border-t border-card-border mt-2">
                  <span className="font-semibold text-text-primary">Total Amount</span>
                  <span className="font-extrabold text-accent text-xl font-mono">₹{Number(quotation.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
               </div>
            </div>
         </div>

         {/* Notes */}
         {quotation.notes && (
           <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Notes</span>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{quotation.notes}</p>
           </div>
         )}
      </div>

      {/* History Timeline */}
      <div className="bg-white border text-text-primary border-card-border rounded-xl shadow-sm p-6">
         <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
           <Clock className="w-5 h-5 text-slate-400" /> Activity Timeline
         </h3>
         <div className="space-y-4 pl-3 border-l-2 border-slate-100 ml-2">
            <div className="relative">
              <div className="absolute -left-[19px] top-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white" />
              <div className="text-xs text-text-muted">
                <span className="font-semibold">Created</span> on <span className="font-mono">{format(new Date(quotation.created_at || new Date()), "dd MMM yyyy, p")}</span>
                {quotation.created_by?.name && <span className="text-slate-500"> by {quotation.created_by.name}</span>}
              </div>
            </div>
            
            {quotation.status === 'sent' && (
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white" />
                <div className="text-sm">
                  <span className="font-semibold text-blue-600">Sent</span> 
                </div>
              </div>
            )}

            {quotation.status === 'accepted' && (
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                <div className="text-sm">
                  <span className="font-semibold text-green-600">Accepted</span> 
                  {quotation.invoices?.invoice_number && (
                     <span className="text-slate-500 block mt-0.5">Invoice generated: INV-{String(quotation.invoices.invoice_number).padStart(4, "0")}</span>
                  )}
                </div>
              </div>
            )}

            {quotation.status === 'rejected' && (
              <div className="relative">
                <div className="absolute -left-[19px] top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                <div className="text-sm">
                  <span className="font-semibold text-red-600">Rejected</span> 
                </div>
              </div>
            )}
         </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden zoom-in-95 animate-in">
             <div className="p-6">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Accept this quotation?</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  This action will mark the quotation as accepted and automatically generate an active Invoice for <strong className="text-primary">{quotation.customer_name}</strong> for the amount of <strong className="text-accent font-mono">₹{quotation.total_amount}</strong>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                     onClick={() => setShowAcceptModal(false)}
                     disabled={isProcessing}
                     className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleAccept}
                     disabled={isProcessing}
                     className="px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                   >
                     {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Create Invoice"}
                   </button>
                </div>
             </div>
           </div>
         </div>
      )}

    </div>
  );
}
