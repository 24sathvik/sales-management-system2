import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// UUID validation regex (v4)
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(uuid: string): boolean {
  return uuidRegex.test(uuid);
}

// Format currency in INR
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function mapQuotationToSnakeCase(q: any) {
  if (!q) return q;
  return {
    ...q,
    quotation_number: q.quotationNumber,
    customer_name: q.customerName,
    customer_email: q.customerEmail,
    customer_phone: q.customerPhone,
    customer_address: q.customerAddress,
    subtotal: q.subtotal,
    discount_type: q.discountType,
    discount_percent: q.discountPercent,
    discount_amount: q.discountAmount,
    gst_percent: q.gstPercent,
    tax_amount: q.taxAmount,
    total_amount: q.totalAmount,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
    deleted_at: q.deletedAt,
    created_by: q.createdBy,
    invoice_id: q.invoiceId,
    company_name: q.companyName,
    job_title: q.jobTitle,
    printing_color: q.printingColor,
    paper_size: q.paperSize,
    paper_type: q.paperType,
    finish_type: q.finishType,
    printing_sides: q.printingSides,
    delivery_date: q.deliveryDate,
    advance_required: q.advanceRequired,
    payment_terms: q.paymentTerms,
    custom_payment_terms: q.customPaymentTerms,
    created_by_user: q.creator ? { id: q.creator.id, full_name: q.creator.name, email: q.creator.email } : null,
  };
}
