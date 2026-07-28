CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE invoice_status AS ENUM ('active', 'closed');
CREATE TYPE pipeline_stage AS ENUM (
  'RAW_MATERIALS', 'DESIGN', 'PRINTING', 
  'POST_PRINTING', 'PAYMENT_PENDING'
);
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid');
CREATE TYPE payment_mode AS ENUM ('cash', 'online', 'upi');
CREATE TYPE transaction_type AS ENUM ('advance', 'balance', 'adjustment');
CREATE TYPE quotation_status AS ENUM (
  'draft', 'sent', 'accepted', 'rejected'
);
CREATE TYPE purchase_payment_status AS ENUM ('pending', 'paid');
CREATE TYPE expense_category AS ENUM (
  'rent', 'salary', 'utilities', 'maintenance', 
  'marketing', 'transport', 'miscellaneous'
);

-- ### TABLE 1: profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_initials TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on user signup:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ### TABLE 2: categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default categories:
INSERT INTO categories (name) VALUES
  ('Flyers'), ('Banners'), ('Wedding Cards'),
  ('Brochures'), ('Calendars'), ('Envelopes'),
  ('Visiting Cards'), ('Flex Printing'),
  ('Stickers'), ('Letterheads'), ('Uncategorized')
ON CONFLICT (name) DO NOTHING;

-- ### TABLE 3: quotations

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  valid_until DATE,
  status quotation_status NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  invoice_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate quotation_number:
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(NULLIF(SUBSTRING(quotation_number FROM 5), '') AS INTEGER)
  ), 0) + 1
  INTO next_num FROM quotations WHERE quotation_number LIKE 'QUO-%';
  NEW.quotation_number := 'QUO-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quotation_number ON quotations;

CREATE TRIGGER set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
  EXECUTE FUNCTION generate_quotation_number();

-- ### TABLE 4: invoices

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  customer_address TEXT,
  description TEXT,
  category TEXT,
  qty INTEGER DEFAULT 0,
  printing_color TEXT,
  bill_value NUMERIC(12,2) DEFAULT 0,
  advance_paid NUMERIC(12,2) DEFAULT 0,
  balance_due NUMERIC(12,2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  designer TEXT,
  printer TEXT,
  confirmed_on DATE,
  delivery_date DATE,
  status invoice_status DEFAULT 'active',
  pipeline_stage pipeline_stage DEFAULT 'RAW_MATERIALS',
  assignee_id UUID REFERENCES profiles(id),
  assignee_name TEXT,
  quotation_id UUID REFERENCES quotations(id),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate invoice_number:
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(NULLIF(SUBSTRING(invoice_number FROM 5), '') AS INTEGER)
  ), 0) + 1
  INTO next_num FROM invoices WHERE invoice_number LIKE 'INV-%';
  NEW.invoice_number := 'INV-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_invoice_number ON invoices;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- Update balance_due automatically:
CREATE OR REPLACE FUNCTION update_balance_due()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due := NEW.bill_value - NEW.advance_paid;
  IF NEW.balance_due <= 0 THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.advance_paid > 0 THEN
    NEW.payment_status := 'partial';
  ELSE
    NEW.payment_status := 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS compute_balance_due ON invoices;

CREATE TRIGGER compute_balance_due
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_balance_due();

-- ### TABLE 5: wip_cards

CREATE TABLE wip_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  stage pipeline_stage NOT NULL DEFAULT 'RAW_MATERIALS',
  progress_current INTEGER DEFAULT 0,
  progress_total INTEGER DEFAULT 100,
  assigned_to UUID REFERENCES profiles(id),
  assigned_name TEXT,
  from_quotation BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invoice_id)
);

-- ### TABLE 6: final_check_protocols

CREATE TABLE final_check_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  checks JSONB NOT NULL DEFAULT '[]',
  total_checks INTEGER DEFAULT 51,
  completed_checks INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invoice_id)
);

-- ### TABLE 7: purchases

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  invoice_number TEXT,
  customer_name TEXT,
  category TEXT,
  description TEXT,
  qty INTEGER,
  bill_value NUMERIC(12,2),
  vendor_role TEXT, 
  vendor_name TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  payment_status purchase_payment_status DEFAULT 'pending',
  payment_mode payment_mode,
  paid_on DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ### TABLE 8: transactions

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id),
  invoice_number TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  transaction_type transaction_type NOT NULL,
  recorded_by UUID REFERENCES profiles(id),
  recorded_by_name TEXT,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ### TABLE 9: expenses

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category expense_category NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  expense_month INTEGER NOT NULL, 
  expense_year INTEGER NOT NULL,
  payment_mode payment_mode DEFAULT 'cash',
  paid_on DATE,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ### TABLE 10: account_credits

CREATE TABLE account_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  credit_date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ### TABLE 11: account_debits

CREATE TABLE account_debits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  mode payment_mode NOT NULL,
  debit_date DATE DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ### INDEXES (for performance)

CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_pipeline ON invoices(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_invoices_delivery ON invoices(delivery_date);
CREATE INDEX IF NOT EXISTS idx_invoices_assignee ON invoices(assignee_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation ON invoices(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_purchases_invoice ON purchases(invoice_id);
CREATE INDEX IF NOT EXISTS idx_wip_invoice ON wip_cards(invoice_id);
CREATE INDEX IF NOT EXISTS idx_final_check_invoice ON final_check_protocols(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_month_year ON expenses(expense_month, expense_year);

-- ### UPDATED_AT TRIGGERS (for all tables)

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_quotations_updated ON quotations;
CREATE TRIGGER trg_quotations_updated 
  BEFORE UPDATE ON quotations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_invoices_updated ON invoices;
CREATE TRIGGER trg_invoices_updated 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_wip_updated ON wip_cards;
CREATE TRIGGER trg_wip_updated 
  BEFORE UPDATE ON wip_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_final_check_updated ON final_check_protocols;
CREATE TRIGGER trg_final_check_updated 
  BEFORE UPDATE ON final_check_protocols 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_purchases_updated ON purchases;
CREATE TRIGGER trg_purchases_updated 
  BEFORE UPDATE ON purchases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated ON expenses;
CREATE TRIGGER trg_expenses_updated 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ### ROW LEVEL SECURITY — Enable on ALL tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wip_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_check_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_debits ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can do everything
-- Drop existing policies first if they exist to prevent errors
DO $$ 
BEGIN
  BEGIN DROP POLICY "authenticated_full_access" ON profiles; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON categories; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON quotations; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON invoices; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON wip_cards; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON final_check_protocols; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON purchases; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON transactions; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON expenses; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON account_credits; EXCEPTION WHEN undefined_object THEN END;
  BEGIN DROP POLICY "authenticated_full_access" ON account_debits; EXCEPTION WHEN undefined_object THEN END;
END $$;

CREATE POLICY "authenticated_full_access" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON quotations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON wip_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON final_check_protocols FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON account_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_full_access" ON account_debits FOR ALL TO authenticated USING (true) WITH CHECK (true);
