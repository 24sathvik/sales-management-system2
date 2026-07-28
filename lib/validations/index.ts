import { z } from "zod";

const stringMax = (max: number) => z.string().max(max, `Must be at most ${max} characters`);
export const phoneSchema = z.string().min(5, "Must be a valid phone number (at least 5 digits)");

export const positiveDecimal = z.number().nonnegative("Amount must be non-negative");

// Line Item shared schema
export const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hsn: z.string().optional(),
  uom: z.string().min(1, "UOM is required"),
  qty: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be non-negative").optional(),
  unit_price: z.number().min(0, "Price must be non-negative").optional()
});

export const invoiceCreateSchema = z.object({
  invoiceNumber: z.coerce.number().int().positive().optional(),
  customerName: stringMax(100).min(2, "Customer Name is required"),
  phone: phoneSchema,
  brideName: stringMax(100).optional().nullable(),
  groomName: stringMax(100).optional().nullable(),
  modelNumber: stringMax(100),
  category: stringMax(100),
  description: stringMax(500),
  date: z.coerce.date().optional(),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  unitRate: positiveDecimal,
  advancePaid: z.boolean().default(false),
  advanceAmount: positiveDecimal.optional().nullable(),
  advanceMode: z.enum(["ONLINE", "CASH"]).optional().nullable(),
  balanceMode: z.enum(["ONLINE", "CASH"]).optional().nullable(),
  estimatedDesignTime: stringMax(100),
  estimatedPrintTime: stringMax(100),
  packing: z.enum(["WITH_PACKING", "WITHOUT_PACKING"]),
  printingColor: stringMax(100).optional().nullable(),
  designer: stringMax(100).optional().nullable(),
  printer: stringMax(100).optional().nullable(),
  additionalNotes: stringMax(10000).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  contentConfirmedOn: z.coerce.date().optional().nullable(),
  finalDeliveryDate: z.coerce.date().optional().nullable(),
});
export const invoiceSchema = invoiceCreateSchema;

// Quotation specific schema
export const quotationSchema = z.object({
  customerName: z.string().min(1, "Name required"),
  customerEmail: z.string().optional().nullable(),
  customerPhone: z.string().min(1, "Valid phone required").optional().nullable(),
  customerAddress: z.string().min(1, "Address required").optional().nullable(),
  jobTitle: z.string().min(1, "Job title/subject required").optional().nullable(),
  deliveryDate: z.coerce.date().optional().nullable(),
  validUntil: z.coerce.date().optional().nullable(),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  subtotal: positiveDecimal.optional().default(0),
  discountType: z.enum(["FLAT", "PERCENTAGE"]).optional().default("PERCENTAGE"),
  discountPercent: positiveDecimal.optional().nullable(),
  discountAmount: positiveDecimal.optional().nullable(),
  gstPercent: z.coerce.number().min(0).default(5),
  taxAmount: positiveDecimal.optional().nullable(),
  totalAmount: positiveDecimal.optional().default(0),
  notes: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "accepted", "rejected"]).optional().default("draft"),
});

export const leadCreateSchema = z.object({
  customerName: stringMax(100).min(1),
  phone: phoneSchema,
  category: stringMax(100),
  description: stringMax(500),
  quantity: z.coerce.number().int().positive(),
  assignedToId: z.string().uuid(),
  estimatedBillValue: z.coerce.number().nonnegative(),
  notes: stringMax(1000).optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "NEGOTIATING", "CONVERTED", "LOST"]).optional().nullable(),
});
export const leadSchema = leadCreateSchema;

export const purchaseUpdateSchema = z.object({
  designer1Name: stringMax(100).optional().nullable(),
  designer1Cost: z.coerce.number().nonnegative().optional(),
  designer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  designer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  printer1Name: stringMax(100).optional().nullable(),
  printer1Cost: z.coerce.number().nonnegative().optional(),
  printer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  printer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  rawMaterial1Name: stringMax(100).optional().nullable(),
  rawMaterial1Cost: z.coerce.number().nonnegative().optional(),
  rawMaterial1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  rawMaterial1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  postProcess1Name: stringMax(100).optional().nullable(),
  postProcess1Cost: z.coerce.number().nonnegative().optional(),
  postProcess1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  postProcess1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  notes: stringMax(1000).optional().nullable(),
}).partial();

export const wipChecklistUpdateSchema = z.record(z.string(), z.boolean());

export const expenseCreateSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  category: z.enum(["RENT", "SALARY", "ELECTRICITY", "FUEL", "INTERNET", "MISC", "OTHER"]),
  amount: z.coerce.number().positive(),
  description: stringMax(500).optional().nullable(),
  paidOn: z.coerce.date().optional().nullable(),
  paymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
});

export const transactionCreateSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"]),
  mode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]),
  amount: positiveDecimal,
  description: stringMax(500),
  invoiceId: z.string().uuid().optional().nullable(),
  invoiceNumber: stringMax(50).optional().nullable(),
  category: z.enum([
    "INVOICE_ADVANCE", "INVOICE_BALANCE", "INVOICE_FULL_PAYMENT", 
    "VENDOR_PAYMENT", "OVERHEAD", "MISC_INCOME", "MISC_EXPENSE"
  ])
});
