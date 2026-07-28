/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useMemo, useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, ArrowRight, ArrowLeft, Calendar, Send } from "lucide-react";
import { quotationSchema } from "@/lib/validations";
import { GST_RATES } from "@/lib/constants/gst";
import dynamic from "next/dynamic";

const PDFDownloadButton = dynamic(
  () => import("./QuotationPDFDownloadButton"),
  { ssr: false }
);

type FormValues = z.infer<typeof quotationSchema>;

interface QuotationNotesData {
  leadSource?: string;
  followUpDate?: string;
  privateNotes?: string;
}

export function QuotationForm({ initialData, quotationId }: {
  initialData?: Partial<FormValues> & { quotationNumber?: string };
  quotationId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"EDIT" | "REVIEW">("EDIT");

  // Load complex notes data
  let parsedNotes: QuotationNotesData = {};
  if (initialData?.notes) {
    try {
      parsedNotes = JSON.parse(initialData.notes);
    } catch (e) {
      // If it's not JSON, it might just be a string from older records
      parsedNotes = { privateNotes: initialData.notes };
    }
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
    trigger
  } = useForm<FormValues & QuotationNotesData>({
    resolver: zodResolver(
      quotationSchema.extend({
        leadSource: z.string().optional(),
        followUpDate: z.string().optional(),
        privateNotes: z.string().optional(),
        discountType: z.enum(["FLAT", "PERCENTAGE"]).default("PERCENTAGE"),
        discountValue: z.coerce.number().min(0).default(0),
      })
    ) as any,
    defaultValues: {
      ...(initialData as any),
      customerName: initialData?.customerName || "",
      customerPhone: initialData?.customerPhone || "",
      customerEmail: initialData?.customerEmail || "",
      customerAddress: initialData?.customerAddress || "",
      jobTitle: initialData?.jobTitle || "",
      deliveryDate: initialData?.deliveryDate ? new Date(initialData.deliveryDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().slice(0, 10) : (() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
      })(),
      items: initialData?.items && Array.isArray(initialData.items) && initialData.items.length > 0
        ? initialData.items.map((it: any, i: number) => ({
            id: String(i),
            description: it.description || "",
            uom: it.uom || "Nos",
            qty: Number(it.qty) || 1,
            unit_price: Number(it.unit_price) || 0
          }))
        : [{ description: "", uom: "Nos", qty: 1, unit_price: 0 }],
      discountType: initialData?.discountType || (initialData?.discountPercent && Number(initialData.discountPercent) > 0 ? "PERCENTAGE" : "FLAT"),
      discountValue: initialData?.discountPercent && Number(initialData.discountPercent) > 0 ? Number(initialData.discountPercent) : (initialData?.discountAmount ? Number(initialData.discountAmount) : 0),
      discountPercent: initialData?.discountPercent || 0,
      discountAmount: initialData?.discountAmount || 0,
      gstPercent: initialData?.gstPercent || 5,
      status: initialData?.status || "draft",
      
      // Complex Notes Data Defaults
      leadSource: parsedNotes.leadSource || "",
      followUpDate: parsedNotes.followUpDate || "",
      privateNotes: parsedNotes.privateNotes || "",
    },
  });

  const { fields: lineItems, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items" as any
  });

  // Calculations
  const watchItems = useWatch({ control, name: "items" });
  const watchGst = useWatch({ control, name: "gstPercent" }) || 0;
  const watchDiscountType = useWatch({ control, name: "discountType" as any });
  const watchDiscountVal = useWatch({ control, name: "discountValue" as any }) || 0;

  const { subtotal, discountAmount, afterDiscount, taxAmount, totalAmount } = useMemo(() => {
    const sub = watchItems?.reduce((acc: number, item: any) => acc + ((Number(item.qty) || 0) * (Number(item.unit_price) || 0)), 0) || 0;
    const disc = watchDiscountType === "PERCENTAGE" ? sub * (watchDiscountVal / 100) : watchDiscountVal;
    const after = Math.max(0, sub - disc);
    const tax = after * (watchGst / 100);
    const total = after + tax;
    return { subtotal: sub, discountAmount: disc, afterDiscount: after, taxAmount: tax, totalAmount: total };
  }, [watchItems, watchDiscountType, watchDiscountVal, watchGst]);

  // Sync calculations dynamically
  useEffect(() => {
    setValue("subtotal", subtotal);
    setValue("taxAmount", taxAmount);
    setValue("totalAmount", totalAmount);
    setValue("discountAmount", discountAmount);
    setValue("discountPercent", watchDiscountType === "PERCENTAGE" ? watchDiscountVal : 0);
  }, [subtotal, taxAmount, totalAmount, discountAmount, watchDiscountType, watchDiscountVal, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Pack the complex data into notes
      const complexNotes: QuotationNotesData = {
        leadSource: data.leadSource,
        followUpDate: data.followUpDate,
        privateNotes: data.privateNotes,
      };
      
      const payload = {
        ...data,
        notes: JSON.stringify(complexNotes),
      };

      const url = quotationId ? `/api/quotations/${quotationId}` : "/api/quotations";
      const method = quotationId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save quotation");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(quotationId ? "Quotation updated" : "Quotation created successfully");
      router.push("/dashboard/quotations");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save quotation.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });

  useEffect(() => { setMounted(true); }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === lineItems.length - 1) {
      e.preventDefault();
      appendItem({ description: "", uom: "Nos", qty: 1, unit_price: 0 });
    }
  };

  const currentFormData = useWatch({ control });
  const formattedQuotationNumber = initialData?.quotationNumber || "Draft";

  const onSubmit = (data: any, status: 'draft' | 'sent') => {
    mutation.mutate({ ...data, status });
  };

  if (step === "REVIEW") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
            Review Quotation <span className="text-primary font-mono text-xl">{formattedQuotationNumber}</span>
          </h2>
          <button
            type="button"
            onClick={() => setStep("EDIT")}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Edit Details
          </button>
        </div>

        <div className="bg-white rounded-xl border p-8 shadow-sm">
          <div className="grid grid-cols-2 gap-8 border-b pb-8">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Proposed To</p>
              <p className="font-bold text-slate-800 text-lg">{currentFormData.customerName}</p>
              <p className="text-slate-600 font-mono text-sm">{currentFormData.customerPhone}</p>
              <p className="text-slate-600 mt-1 whitespace-pre-line text-sm">{currentFormData.customerAddress || "No address provided"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Quotation Details</p>
              <p className="text-slate-600 text-sm">Date: <span className="font-mono font-medium text-slate-800">{currentFormData.deliveryDate ? new Date(currentFormData.deliveryDate).toLocaleDateString() : "N/A"}</span></p>
              <p className="text-slate-600 text-sm mt-1">Valid Until: <span className="font-mono font-medium text-slate-800">{currentFormData.validUntil ? new Date(currentFormData.validUntil).toLocaleDateString() : "N/A"}</span></p>
            </div>
          </div>

          <div className="py-8 border-b">
            <h3 className="font-bold text-slate-800 mb-4">{currentFormData.jobTitle || "Quotation Items"}</h3>
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-slate-400">
                  <th className="pb-2 font-semibold">Description</th>
                  <th className="pb-2 font-semibold text-right">Qty</th>
                  <th className="pb-2 font-semibold text-right">Rate</th>
                  <th className="pb-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentFormData.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 pr-4 font-medium text-slate-700 whitespace-pre-line">{item.description}</td>
                    <td className="py-3 text-right font-mono text-slate-600">{item.qty} {item.uom}</td>
                    <td className="py-3 text-right font-mono text-slate-600">₹{Number(item.unit_price).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800">₹{(Number(item.qty) * Number(item.unit_price)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-6 flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Discount</span>
                  <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-600">
                <span>GST ({watchGst}%)</span>
                <span className="font-mono">+₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary pt-3 border-t">
                <span>Total Estimated</span>
                <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => setStep("EDIT")}
            className="px-6 py-3 rounded-lg font-semibold border text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={() => onSubmit(getValues(), 'draft')}
            disabled={mutation.isPending}
            className="px-6 py-3 rounded-lg font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors flex items-center disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => onSubmit(getValues(), 'sent')}
            disabled={mutation.isPending}
            className="px-8 py-3 rounded-lg font-semibold text-white bg-accent hover:bg-accent-dark shadow-lg shadow-accent/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
            Generate & Save
          </button>
        </div>
      </div>
    );
  }

  // --- EDITING MODE ---
  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-300 pb-32 lg:pb-12 tour-quotation">
            <div className="flex items-center justify-between pb-6 border-b mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">
            {quotationId ? "Edit Quotation" : "New Quotation"}
          </h2>
          <p className="text-slate-500 mt-1">Fill out the details below. Required fields are marked with *</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 border px-3 py-1.5 rounded-lg">
            <span className="font-bold text-slate-500">QUO-</span>
            <input
              type="text"
              readOnly
              value={initialData?.quotationNumber ? initialData.quotationNumber.replace("QUO-", "") : "NEW"}
              className="w-16 bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <form className="flex-1 min-w-0 space-y-8" id="quotation-form">
          
          {/* Section 1: Customer & Order Header */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4 tour-q-header">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">1. Lead & Customer Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Customer / Company Name *</label>
                <input {...register("customerName")} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number</label>
                <input {...register("customerPhone")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="10-digit number" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Address</label>
                <textarea {...register("customerAddress")} rows={2} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Subject / Job Title *</label>
                <input {...register("jobTitle")} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="e.g. Quotation for Supply of Material" />
                {errors.jobTitle && <p className="text-xs text-red-500">{errors.jobTitle.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Inquiry Date
                </label>
                <input type="date" {...register("deliveryDate")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Lead Source</label>
                <input {...register("leadSource")} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="e.g. Google, Referral" />
              </div>
            </div>
          </section>

          {/* Section 2: Estimated Items / Scope */}
          <section className="bg-white border rounded-xl shadow-[var(--shadow-card)] overflow-hidden tour-q-scope">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-display font-bold text-lg text-primary">2. Estimated Scope</h3>
              <p className="text-xs text-slate-500 mt-1">Press Enter on the last field to quickly add a new row.</p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="hidden md:grid grid-cols-[1fr_6rem_6rem_8rem_8rem_3rem] gap-4 px-4 py-3 border-b text-sm font-semibold text-slate-600 bg-white">
                <div>Description *</div>
                <div>Qty *</div>
                <div>Unit</div>
                <div>Rate (₹) *</div>
                <div className="text-right">Amount</div>
                <div></div>
              </div>
              
              <div className="flex flex-col divide-y divide-slate-100 bg-white">
                 {lineItems.map((field, index) => {
                    const qty = watchItems?.[index]?.qty || 0;
                    const rate = watchItems?.[index]?.unit_price || 0;
                    const amt = Number(qty) * Number(rate);
                    return (
                       <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-[1fr_6rem_6rem_8rem_8rem_3rem] gap-4 p-4 md:py-2 md:px-4 group hover:bg-slate-50/50 transition-colors items-start">
                          <div className="flex-1 space-y-1 md:space-y-0">
                             <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Description *</label>
                             <textarea
                               {...register(`items.${index}.description` as const)}
                               className="w-full min-w-0 md:min-w-[200px] px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none resize-none transition-all pr-10 md:pr-2"
                               rows={2}
                               placeholder="Item description..."
                             />
                          </div>
                          
                          <div className="grid grid-cols-2 md:contents gap-3 md:gap-0">
                             <div className="space-y-1 md:space-y-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Qty *</label>
                                <input type="number" step="0.01" {...register(`items.${index}.qty` as const, { valueAsNumber: true })} className="w-full px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm font-mono outline-none transition-all" />
                             </div>
                             <div className="space-y-1 md:space-y-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Unit</label>
                                <input {...register(`items.${index}.uom` as const)} className="w-full px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none transition-all" />
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:contents gap-3 md:gap-0">
                             <div className="space-y-1 md:space-y-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Rate (₹) *</label>
                                <input 
                                  type="number" step="0.01" 
                                  {...register(`items.${index}.unit_price` as const, { valueAsNumber: true })} 
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  className="w-full px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm font-mono outline-none transition-all" 
                                />
                             </div>
                             <div className="space-y-1 md:space-y-0 md:pt-1.5 md:text-right">
                                <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Amount</label>
                                <div className="h-[38px] md:h-auto flex items-center md:justify-end px-3 md:px-0 bg-slate-50 md:bg-transparent border border-slate-100 md:border-none rounded-md font-mono font-bold text-slate-800">
                                   ₹{amt.toFixed(2)}
                                </div>
                             </div>
                          </div>
                          
                          <div className="absolute top-4 right-4 md:static md:pt-1.5">
                             <button
                                type="button"
                                onClick={() => {
                                  if (lineItems.length > 1) removeItem(index);
                                  else toast.error("Must have at least one item");
                                }}
                                className="p-2 md:p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                       </div>
                    );
                 })}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t">
              <button type="button" onClick={() => appendItem({ description: "", uom: "Nos", qty: 1, unit_price: 0 })} className="flex items-center text-sm font-bold text-primary hover:text-primary-dark transition-colors px-2 py-1">
                <Plus className="w-4 h-4 mr-1" /> Add Line Item
              </button>
            </div>
          </section>

          {/* Section 3: Adjustments */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4 tour-q-adjustments">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">3. Adjustments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Discount</label>
                <div className="flex gap-2">
                  <select {...register("discountType" as any)} className="w-1/3 px-2 py-2 border rounded-md text-sm focus:border-primary outline-none bg-white">
                    <option value="FLAT">Flat (₹)</option>
                    <option value="PERCENTAGE">Percent (%)</option>
                  </select>
                  <input type="number" step="0.01" {...register("discountValue" as any, { valueAsNumber: true })} className="w-2/3 px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">GST Tax (%)</label>
                <select {...register("gstPercent", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors bg-white">
                  {GST_RATES.map((rate) => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Section 4: Validity & Notes */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">4. Validity & Follow-up</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Quote Valid Until
                </label>
                <input type="date" {...register("validUntil")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Follow-up Reminder Date
                </label>
                <input type="date" {...register("followUpDate")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Private Notes (Internal Only)</label>
                <textarea {...register("privateNotes")} rows={3} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary outline-none resize-none transition-colors bg-slate-50" placeholder="These notes will not be printed on the quotation PDF..." />
              </div>
            </div>
          </section>
        </form>

        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 lg:w-80 shrink-0 bg-[var(--base-dark)] rounded-xl shadow-xl overflow-hidden text-white z-30 h-fit">
          <div className="p-5 space-y-3">
            <h3 className="text-slate-300 font-display font-bold border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider text-sm">Quotation Value</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-mono font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-amber-400">
                <span>Discount</span>
                <span className="font-mono">-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">GST ({watchGst}%)</span>
              <span className="font-mono font-medium">+₹{taxAmount.toFixed(2)}</span>
            </div>
            
            <div className="pt-3 mt-3 border-t border-slate-700 flex justify-between items-center">
              <span className="font-bold text-slate-200">Total Est.</span>
              <span className="font-mono font-bold text-lg text-white">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="bg-[var(--bg-sidebar-solid)] p-5 border-t border-[var(--border-sidebar)]">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display font-bold text-primary-muted text-sm tracking-wide">EST. TOTAL</span>
              <span className="font-mono font-bold text-2xl text-primary-light">₹{totalAmount.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                 const isValid = await trigger(["customerName", "jobTitle", "items"]);
                 if (isValid) {
                   setStep("REVIEW");
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 } else {
                   toast.error("Please fill all required fields correctly.");
                 }
              }}
              className="w-full py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Review Quotation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Fixed Footer */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-[var(--bg-sidebar-solid)] border-t border-[var(--border-sidebar)] text-white shadow-2xl">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="font-display font-bold text-primary-muted text-sm tracking-wide">EST. TOTAL</span>
              <span className="font-mono font-bold text-xl text-primary-light">₹{totalAmount.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                 const isValid = await trigger(["customerName", "jobTitle", "items"]);
                 if (isValid) {
                   setStep("REVIEW");
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 } else {
                   toast.error("Please fill all required fields correctly.");
                 }
              }}
              className="w-full py-3 bg-accent hover:bg-accent-dark text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Review Quotation <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
