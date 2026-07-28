/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useMemo, useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, ArrowRight, ArrowLeft, Calendar, FileText } from "lucide-react";
import { invoiceSchema } from "@/lib/validations";
import { differenceInDays, startOfDay } from "date-fns";
import dynamic from "next/dynamic";
import { GST_RATES } from "@/lib/constants/gst";

const PDFDownloadButton = dynamic(
  () => import("./PDFDownloadButton"),
  { ssr: false }
);

type FormValues = z.infer<typeof invoiceSchema>;

// Extend form state with the JSON fields
interface InvoiceComplexData {
  customerAddress: string;
  expectedDeliveryDate: string;
  discountType: "FLAT" | "PERCENTAGE";
  discountValue: number;
  gstPercent: number;
  notes: string;
  termsAndConditions: string;
  items: Array<{
    id: string;
    description: string;
    hsn: string;
    qty: number;
    rate: number;
    uom: string;
  }>;
}

const DEFAULT_TERMS = "1. Payment must be made within 15 days of invoice date.\n2. Goods once sold will not be taken back.\n3. Subject to local jurisdiction.";

export function InvoiceForm({ initialData, invoiceId }: {
  initialData?: Partial<FormValues> & { invoiceNumber?: string, balance?: number };
  invoiceId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"EDIT" | "REVIEW">("EDIT");

  // Load initial complex data
  let initialComplexData: Partial<InvoiceComplexData> = {};
  if (initialData?.additionalNotes) {
    try {
      initialComplexData = JSON.parse(initialData.additionalNotes);
    } catch (e) {
      console.error("Failed to parse additionalNotes", e);
    }
  }

  const { data: nextNumberData } = useQuery({
    queryKey: ["next-invoice-number"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/next-number");
      if (!res.ok) throw new Error("Failed to fetch next number");
      return res.json();
    },
    enabled: !invoiceId, 
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isValid },
    trigger
  } = useForm<FormValues & InvoiceComplexData>({
    resolver: zodResolver(
      invoiceSchema.extend({
        customerAddress: z.string().optional(),
        expectedDeliveryDate: z.string().optional().default(""),
        discountType: z.enum(["FLAT", "PERCENTAGE"]).default("FLAT"),
        discountValue: z.coerce.number().min(0).default(0),
        gstPercent: z.coerce.number().min(0).default(5),
        notes: z.string().optional(),
        termsAndConditions: z.string().default(DEFAULT_TERMS),
        items: z.array(z.object({
          id: z.string(),
          description: z.string().min(1, "Required"),
          hsn: z.string().optional(),
          qty: z.coerce.number().min(0.01),
          rate: z.coerce.number().min(0),
          uom: z.string()
        })).min(1, "At least one item required")
      })
    ) as any,
    defaultValues: {
      ...(initialData as any),
      date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      quantity: 1,
      unitRate: 0,
      advancePaid: initialData?.advancePaid || false,
      packing: initialData?.packing || "WITHOUT_PACKING",
      category: initialData?.category || "General",
      modelNumber: initialData?.modelNumber || "-",
      description: initialData?.description || "Invoice",
      estimatedDesignTime: "-",
      estimatedPrintTime: "-",
      invoiceNumber: initialData?.invoiceNumber ? Number(initialData.invoiceNumber) : undefined,
      
      // Complex Data Defaults
      customerAddress: initialComplexData.customerAddress || "",
      expectedDeliveryDate: initialComplexData.expectedDeliveryDate || (initialData?.finalDeliveryDate ? new Date(initialData.finalDeliveryDate).toISOString().slice(0, 10) : ""),
      discountType: initialComplexData.discountType || "FLAT",
      discountValue: initialComplexData.discountValue || 0,
      gstPercent: initialComplexData.gstPercent ?? 5,
      notes: initialComplexData.notes || "",
      termsAndConditions: initialComplexData.termsAndConditions || DEFAULT_TERMS,
      items: initialComplexData.items || [{ id: "1", description: "", hsn: "", qty: 1, rate: 0, uom: "Nos" }],
    },
  });

  const { fields: lineItems, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items"
  });

  useEffect(() => {
    if (!invoiceId && nextNumberData?.nextNumber) {
      const current = getValues("invoiceNumber");
      if (!current) {
        setValue("invoiceNumber", nextNumberData.nextNumber, { shouldValidate: true });
      }
    }
  }, [nextNumberData, invoiceId, setValue]);

  // Calculations
  const watchItems = useWatch({ control, name: "items" });
  const watchGst = useWatch({ control, name: "gstPercent" }) || 0;
  const watchDiscountType = useWatch({ control, name: "discountType" });
  const watchDiscountVal = useWatch({ control, name: "discountValue" }) || 0;
  const watchAdvPaid = useWatch({ control, name: "advancePaid" });
  const watchAdvAmount = useWatch({ control, name: "advanceAmount" }) || 0;
  const watchExpectedDate = useWatch({ control, name: "expectedDeliveryDate" });

  const { subtotal, discountAmount, afterDiscount, taxAmount, totalAmount, balance } = useMemo(() => {
    const sub = watchItems?.reduce((acc, item) => acc + ((item.qty || 0) * (item.rate || 0)), 0) || 0;
    const disc = watchDiscountType === "PERCENTAGE" ? sub * (watchDiscountVal / 100) : watchDiscountVal;
    const after = Math.max(0, sub - disc);
    const tax = after * (watchGst / 100);
    const total = after + tax;
    const bal = watchAdvPaid ? Math.max(0, total - Number(watchAdvAmount)) : total;
    return { subtotal: sub, discountAmount: disc, afterDiscount: after, taxAmount: tax, totalAmount: total, balance: bal };
  }, [watchItems, watchDiscountType, watchDiscountVal, watchGst, watchAdvPaid, watchAdvAmount]);

  // Sync to Zod fields dynamically
  useEffect(() => {
    setValue("unitRate", Number(totalAmount.toFixed(2)));
    if (watchExpectedDate) {
      setValue("finalDeliveryDate", new Date(watchExpectedDate));
    }
  }, [totalAmount, watchExpectedDate, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues & InvoiceComplexData) => {
      // Pack the complex data into additionalNotes
      const complexData: InvoiceComplexData = {
        customerAddress: data.customerAddress,
        expectedDeliveryDate: data.expectedDeliveryDate,
        discountType: data.discountType,
        discountValue: data.discountValue,
        gstPercent: data.gstPercent,
        notes: data.notes,
        termsAndConditions: data.termsAndConditions,
        items: data.items,
      };
      
      const payload = {
        ...data,
        additionalNotes: JSON.stringify(complexData),
      };

      const url = invoiceId ? `/api/invoices/${invoiceId}` : "/api/invoices";
      const method = invoiceId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(invoiceId ? "Invoice updated" : "Invoice created successfully");
      router.push("/dashboard/invoices");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save invoice.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  useEffect(() => { setMounted(true); }, []);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" && index === lineItems.length - 1) {
      e.preventDefault();
      appendItem({ id: Date.now().toString(), description: "", hsn: "", qty: 1, rate: 0, uom: "Nos" });
    }
  };

  const getUrgencyBadge = () => {
    if (!watchExpectedDate) return null;
    const date = startOfDay(new Date(watchExpectedDate));
    const today = startOfDay(new Date());
    const diff = differenceInDays(date, today);
    
    if (diff < 0) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ml-2 tracking-wider">Overdue</span>;
    if (diff === 0) return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ml-2 tracking-wider">Due Today</span>;
    if (diff <= 7) return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ml-2 tracking-wider">Urgent: {diff} days</span>;
    return null;
  };

  const currentFormData = useWatch({ control });
  const formattedInvoiceNumber = currentFormData.invoiceNumber ? `INV-${String(currentFormData.invoiceNumber).padStart(4, "0")}` : (nextNumberData?.formattedNextNumber || "Draft");

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  if (step === "REVIEW") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 pb-20">
        <div className="flex items-center justify-between pb-4 border-b">
          <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-2">
            Review Invoice <span className="text-primary font-mono text-xl">{formattedInvoiceNumber}</span>
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
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Billed To</p>
              <p className="font-bold text-slate-800 text-lg">{currentFormData.customerName}</p>
              <p className="text-slate-600 font-mono text-sm">{currentFormData.phone}</p>
              <p className="text-slate-600 mt-1 whitespace-pre-line text-sm">{currentFormData.customerAddress || "No address provided"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold text-slate-400 mb-2 tracking-wider">Invoice Details</p>
              <p className="text-slate-600 text-sm">Date: <span className="font-mono font-medium text-slate-800">{currentFormData.date ? new Date(currentFormData.date).toLocaleDateString() : "N/A"}</span></p>
              <p className="text-slate-600 text-sm mt-1 flex items-center justify-end">
                Expected: <span className="font-mono font-medium text-slate-800 ml-1">{watchExpectedDate ? new Date(watchExpectedDate).toLocaleDateString() : "Not set"}</span>
                {getUrgencyBadge()}
              </p>
            </div>
          </div>

          <div className="py-8 border-b">
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
                    <td className="py-3 text-right font-mono text-slate-600">₹{Number(item.rate).toFixed(2)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-slate-800">₹{(item.qty * item.rate).toFixed(2)}</td>
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
              <div className="flex justify-between text-lg font-bold text-slate-800 pt-3 border-t">
                <span>Total</span>
                <span className="font-mono">₹{totalAmount.toFixed(2)}</span>
              </div>
              {watchAdvPaid && (
                <div className="flex justify-between text-sm text-green-600 font-medium pt-1">
                  <span>Advance ({currentFormData.advanceMode})</span>
                  <span className="font-mono">-₹{Number(watchAdvAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-primary pt-3 border-t">
                <span>Balance Due</span>
                <span className="font-mono">₹{balance.toFixed(2)}</span>
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
            onClick={handleSubmit(onSubmit)}
            disabled={mutation.isPending}
            className="px-8 py-3 rounded-lg font-semibold text-white bg-primary hover:bg-[var(--primary-hover)] shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Confirm & Create Invoice
          </button>
        </div>
      </div>
    );
  }

  // --- EDITING MODE ---
  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in duration-300 pb-32 lg:pb-12">
      <div className="flex items-center justify-between pb-6 border-b mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">
            {invoiceId ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <p className="text-slate-500 mt-1">Fill out the details below. Required fields are marked with *</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 border px-3 py-1.5 rounded-lg">
            <span className="font-bold text-slate-500">INV-</span>
            <input
              type="number"
              {...register("invoiceNumber", { valueAsNumber: true })}
              className="w-20 bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <form className="flex-1 min-w-0 space-y-8" id="invoice-form">
          
          {/* Section 1: Customer & Order Header */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">1. Customer & Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Customer Name *</label>
                <input {...register("customerName")} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message as string}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Phone Number *</label>
                <input {...register("phone")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" placeholder="10-digit number" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message as string}</p>}
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Delivery Address</label>
                <textarea {...register("customerAddress")} rows={2} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Order Date
                </label>
                <input type="date" {...register("date")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Expected Delivery Date {getUrgencyBadge()}
                </label>
                <input type="date" {...register("expectedDeliveryDate")} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
              </div>
            </div>
          </section>

          {/* Section 2: Line Items */}
          <section className="bg-white border rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-display font-bold text-lg text-primary">2. Line Items</h3>
              <p className="text-xs text-slate-500 mt-1">Press Enter on the last field to quickly add a new row.</p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="hidden md:grid grid-cols-[1fr_6rem_6rem_6rem_8rem_8rem_3rem] gap-4 px-4 py-3 border-b text-sm font-semibold text-slate-600 bg-white">
                <div>Description *</div>
                <div>HSN</div>
                <div>Qty *</div>
                <div>Unit</div>
                <div>Rate (₹) *</div>
                <div className="text-right">Amount</div>
                <div></div>
              </div>
              
              <div className="flex flex-col divide-y divide-slate-100 bg-white">
                 {lineItems.map((field, index) => {
                    const qty = watchItems?.[index]?.qty || 0;
                    const rate = watchItems?.[index]?.rate || 0;
                    const amt = qty * rate;
                    return (
                       <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-[1fr_6rem_6rem_6rem_8rem_8rem_3rem] gap-4 p-4 md:py-2 md:px-4 group hover:bg-slate-50/50 transition-colors items-start">
                          <div className="flex-1 space-y-1 md:space-y-0">
                             <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">Description *</label>
                             <textarea
                               {...register(`items.${index}.description` as const)}
                               className="w-full min-w-0 md:min-w-[200px] px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm outline-none resize-none transition-all pr-10 md:pr-2"
                               rows={2}
                               placeholder="Item description..."
                             />
                             {errors.items?.[index]?.description && <p className="text-[10px] text-red-500 mt-1 md:mt-0">{errors.items[index]?.description?.message as string}</p>}
                          </div>
                          
                          <div className="grid grid-cols-3 md:contents gap-3 md:gap-0">
                             <div className="space-y-1 md:space-y-0">
                                <label className="text-[10px] uppercase font-bold text-slate-400 md:hidden">HSN</label>
                                <input {...register(`items.${index}.hsn` as const)} className="w-full px-3 py-2 md:px-2 md:py-1.5 border border-slate-200 md:border-transparent md:group-hover:border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm font-mono outline-none transition-all" />
                             </div>
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
                                  {...register(`items.${index}.rate` as const, { valueAsNumber: true })} 
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
              <button type="button" onClick={() => appendItem({ id: Date.now().toString(), description: "", hsn: "", qty: 1, rate: 0, uom: "Nos" })} className="flex items-center text-sm font-bold text-primary hover:text-primary-dark transition-colors px-2 py-1">
                <Plus className="w-4 h-4 mr-1" /> Add Line Item
              </button>
            </div>
          </section>

          {/* Section 3: Adjustments */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">3. Adjustments</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Discount</label>
                <div className="flex gap-2">
                  <select {...register("discountType")} className="w-1/3 px-2 py-2 border rounded-md text-sm focus:border-primary outline-none bg-white">
                    <option value="FLAT">₹</option>
                    <option value="PERCENTAGE">%</option>
                  </select>
                  <input type="number" step="0.01" {...register("discountValue")} className="flex-1 px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
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

          {/* Section 4: Payment */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">4. Payment</h3>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border">
              <input type="checkbox" id="advancePaid" {...register("advancePaid")} className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer" />
              <label htmlFor="advancePaid" className="text-sm font-bold text-slate-700 cursor-pointer select-none">Record Advance Payment</label>
            </div>
            
            {watchAdvPaid && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Amount Received (₹)</label>
                  <input type="number" step="0.01" {...register("advanceAmount", { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:border-primary outline-none transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Payment Mode</label>
                  <select {...register("advanceMode")} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary outline-none bg-white">
                    <option value="">Select Mode</option>
                    <option value="ONLINE">Online</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Notes & Terms */}
          <section className="bg-white p-6 rounded-xl border shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-display font-bold text-lg text-primary border-b pb-2">5. Notes & Terms</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Internal / Private Notes</label>
                <textarea {...register("notes")} rows={2} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary outline-none resize-none transition-colors" placeholder="Not visible on printed invoice..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  Terms & Conditions
                  <span className="text-[10px] text-slate-400 font-normal normal-case">Visible on PDF</span>
                </label>
                <textarea {...register("termsAndConditions")} rows={4} className="w-full px-3 py-2 border rounded-md text-sm focus:border-primary outline-none resize-none transition-colors font-mono text-slate-600 bg-slate-50" />
              </div>
            </div>
          </section>
        </form>

        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:sticky lg:top-24 lg:w-80 shrink-0 bg-[var(--base-dark)] rounded-xl shadow-xl overflow-hidden text-white z-30 h-fit">
          <div className="p-5 space-y-3">
            <h3 className="text-slate-300 font-display font-bold border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider text-sm">Live Summary</h3>
            
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
              <span className="font-bold text-slate-200">Total</span>
              <span className="font-mono font-bold text-lg text-white">₹{totalAmount.toFixed(2)}</span>
            </div>

            {watchAdvPaid && (
              <div className="flex justify-between text-sm text-green-400 pt-1">
                <span>Advance Received</span>
                <span className="font-mono font-medium">-₹{Number(watchAdvAmount).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          <div className="bg-[var(--bg-sidebar-solid)] p-5 border-t border-[var(--border-sidebar)]">
            <div className="flex justify-between items-center mb-4">
              <span className="font-display font-bold text-primary-muted text-sm tracking-wide">BALANCE DUE</span>
              <span className="font-mono font-bold text-2xl text-primary-light">₹{balance.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                 const isValid = await trigger(["customerName", "phone", "items"]);
                 if (isValid) {
                   setStep("REVIEW");
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 } else {
                   toast.error("Please fill all required fields correctly.");
                 }
              }}
              className="w-full py-3 bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Review Invoice <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Fixed Footer */}
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-[var(--bg-sidebar-solid)] border-t border-[var(--border-sidebar)] text-white shadow-2xl">
          <div className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="font-display font-bold text-primary-muted text-sm tracking-wide">BALANCE DUE</span>
              <span className="font-mono font-bold text-xl text-primary-light">₹{balance.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                 const isValid = await trigger(["customerName", "phone", "items"]);
                 if (isValid) {
                   setStep("REVIEW");
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 } else {
                   toast.error("Please fill all required fields correctly.");
                 }
              }}
              className="w-full py-3 bg-primary hover:bg-[var(--primary-hover)] text-white rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Review Invoice <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
