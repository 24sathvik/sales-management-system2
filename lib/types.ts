export type UserRole = 'admin' | 'staff';
export type InvoiceStatus = 'active' | 'closed';
export type PipelineStage = 'RAW_MATERIALS' | 'DESIGN' | 'PRINTING' | 'POST_PRINTING' | 'PAYMENT_PENDING';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentMode = 'cash' | 'online' | 'upi';
export type TransactionType = 'advance' | 'balance' | 'adjustment';
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';
export type PurchasePaymentStatus = 'pending' | 'paid';
export type ExpenseCategory = 'rent' | 'salary' | 'utilities' | 'maintenance' | 'marketing' | 'transport' | 'miscellaneous';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_initials?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface QuotationItem {
  id: string;
  description: string;
  category: string;
  qty: number;
  unit_price: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  items: QuotationItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  notes?: string | null;
  valid_until?: string | null;
  status: QuotationStatus;
  created_by?: string | null;
  invoice_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  customer_address?: string | null;
  description?: string | null;
  category?: string | null;
  qty: number;
  printing_color?: string | null;
  bill_value: number;
  advance_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  designer?: string | null;
  printer?: string | null;
  confirmed_on?: string | null;
  delivery_date?: string | null;
  status: InvoiceStatus;
  pipeline_stage: PipelineStage;
  assignee_id?: string | null;
  assignee_name?: string | null;
  quotation_id?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WipCard {
  id: string;
  invoice_id: string;
  stage: PipelineStage;
  progress_current: number;
  progress_total: number;
  assigned_to?: string | null;
  assigned_name?: string | null;
  from_quotation: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinalCheckItem {
  id: number;
  label: string;
  category: string;
  checked: boolean;
  checked_by?: string | null;
  checked_at?: string | null;
}

export interface FinalCheckProtocol {
  id: string;
  invoice_id: string;
  checks: FinalCheckItem[];
  total_checks: number;
  completed_checks: number;
  completed_at?: string | null;
  completed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  invoice_id: string;
  invoice_number?: string | null;
  customer_name?: string | null;
  category?: string | null;
  description?: string | null;
  qty?: number | null;
  bill_value?: number | null;
  vendor_role?: string | null;
  vendor_name?: string | null;
  amount: number;
  payment_status: PurchasePaymentStatus;
  payment_mode?: PaymentMode | null;
  paid_on?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  invoice_id?: string | null;
  invoice_number?: string | null;
  client_name: string;
  client_phone?: string | null;
  amount: number;
  mode: PaymentMode;
  transaction_type: TransactionType;
  recorded_by?: string | null;
  recorded_by_name?: string | null;
  description?: string | null;
  transaction_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description?: string | null;
  amount: number;
  expense_month: number;
  expense_year: number;
  payment_mode: PaymentMode;
  paid_on?: string | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountCredit {
  id: string;
  description?: string | null;
  amount: number;
  mode: PaymentMode;
  credit_date: string;
  recorded_by?: string | null;
  created_at: string;
}

export interface AccountDebit {
  id: string;
  description?: string | null;
  amount: number;
  mode: PaymentMode;
  debit_date: string;
  recorded_by?: string | null;
  created_at: string;
}
