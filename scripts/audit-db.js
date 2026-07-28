const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({
  connectionString: 'postgresql://postgres:fVU5x7LroHcA1dTQ@db.icwebuepmihnpgxylifs.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
const prisma = new PrismaClient();

const OK = '  ✅';
const FAIL = '  ❌';
const WARN = '  ⚠️ ';

async function checkTable(name) {
  try {
    const r = await pool.query(`SELECT COUNT(*) as cnt FROM "${name}"`);
    return `${OK} "${name}" table exists (${r.rows[0].cnt} rows)`;
  } catch(e) {
    return `${FAIL} "${name}" table MISSING: ${e.message}`;
  }
}

async function checkSupabaseTable(supabase, name) {
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(
    'https://icwebuepmihnpgxylifs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data, error } = await sb.from(name).select('*').limit(1);
  if (error) return `${FAIL} "${name}": ${error.message}`;
  return `${OK} "${name}" accessible`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PRINTFLOW PRO — FULL DATABASE AUDIT');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── SECTION 1: Prisma Tables (Auth + Legacy) ──────────────────
  console.log('【 PRISMA TABLES — Auth & Legacy Data 】');
  const prismaTables = ['User','Invoice','Lead','WIPCard','FinalCheck','WIPChecklist','Purchase','MonthlyExpense','CounterTransaction','InvoiceCategory'];
  for (const t of prismaTables) {
    console.log(await checkTable(t));
  }

  // ── SECTION 2: Supabase Tables (New Quotations Module) ────────
  console.log('\n【 SUPABASE TABLES — Quotations Module 】');
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(
    'https://icwebuepmihnpgxylifs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const supabaseTables = ['profiles','categories','quotations','invoices','wip_cards','final_check_protocols','purchases','transactions','expenses','account_credits','account_debits'];
  for (const t of supabaseTables) {
    const { data, error } = await sb.from(t).select('*').limit(1);
    console.log(error ? `${FAIL} "${t}": ${error.message}` : `${OK} "${t}" accessible`);
  }

  // ── SECTION 3: Prisma Enum Types ──────────────────────────────
  console.log('\n【 PRISMA ENUM TYPES 】');
  const enums = ['Role','WIPPhase','InvoiceStatus','LeadStatus','PaymentStatus','PaymentMode','AdvanceMode','BalanceMode','TransactionType','TransactionCategory','ExpenseCategory'];
  for (const e of enums) {
    const r = await pool.query(`SELECT typname FROM pg_type WHERE typname = $1 AND typtype = 'e'`,[e]);
    console.log(r.rows.length ? `${OK} "${e}" enum exists` : `${FAIL} "${e}" enum MISSING`);
  }

  // ── SECTION 4: Critical Triggers ─────────────────────────────
  console.log('\n【 DATABASE TRIGGERS 】');
  const triggers = [
    ['set_quotation_number', 'quotations'],
    ['on_auth_user_created', 'auth.users'],
  ];
  for (const [name] of triggers) {
    const r = await pool.query(`SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = $1`, [name]);
    console.log(r.rows.length ? `${OK} "${name}" trigger exists` : `${WARN} "${name}" trigger not found`);
  }

  // ── SECTION 5: Prisma Auth Test ───────────────────────────────
  console.log('\n【 AUTH SYSTEM TEST 】');
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
      console.log(`${OK} Admin user found via Prisma`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Role:  ${admin.role}`);
    } else {
      console.log(`${FAIL} No ADMIN user exists!`);
    }
    const userCount = await prisma.user.count();
    console.log(`${OK} Total users: ${userCount}`);
  } catch(e) {
    console.log(`${FAIL} Prisma auth test failed: ${e.message}`);
  }

  // ── SECTION 6: Supabase Columns Check ─────────────────────────
  console.log('\n【 QUOTATION TABLE COLUMNS 】');
  const colCheck = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'quotations' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  const expectedCols = ['id','quotation_number','customer_name','customer_email','customer_phone','items','subtotal','discount_percent','tax_percent','total_amount','status','valid_until','invoice_id','created_by','created_at'];
  const actualCols = colCheck.rows.map(r => r.column_name);
  expectedCols.forEach(col => {
    console.log(actualCols.includes(col) ? `${OK} quotations.${col}` : `${FAIL} quotations.${col} MISSING`);
  });

  // ── SECTION 7: Invoice Table Columns ──────────────────────────
  console.log('\n【 INVOICES TABLE COLUMNS (Supabase) 】');
  const invColCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'invoices' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  const invCols = invColCheck.rows.map(r => r.column_name);
  const expectedInvCols = ['id','invoice_number','customer_name','bill_value','balance_due','advance_paid','payment_status','delivery_date','status','pipeline_stage','assignee_id','quotation_id'];
  expectedInvCols.forEach(col => {
    console.log(invCols.includes(col) ? `${OK} invoices.${col}` : `${FAIL} invoices.${col} MISSING`);
  });

  // ── SECTION 8: wip_cards columns ──────────────────────────────
  console.log('\n【 WIP_CARDS TABLE COLUMNS 】');
  const wipColCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'wip_cards' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `);
  const wipCols = wipColCheck.rows.map(r => r.column_name);
  ['id','invoice_id','stage','from_quotation','progress_current','progress_total','assigned_to','notes'].forEach(col => {
    console.log(wipCols.includes(col) ? `${OK} wip_cards.${col}` : `${FAIL} wip_cards.${col} MISSING`);
  });

  // ── SECTION 9: categories seed check ─────────────────────────
  console.log('\n【 DEFAULT DATA 】');
  const { data: cats } = await sb.from('categories').select('name');
  console.log(cats?.length ? `${OK} ${cats.length} categories seeded: ${cats.map(c=>c.name).join(', ')}` : `${FAIL} No categories seeded!`);

  // ── SECTION 10: Known Issues / Warnings ───────────────────────
  console.log('\n【 KNOWN ISSUES TO WATCH 】');
  
  // Check if quotation-actions uses correct column 'stage' vs 'phase'
  const wipCols2 = wipCols;
  if (wipCols2.includes('stage')) {
    console.log(`${WARN} wip_cards uses "stage" column — but quotation-actions.ts inserts "phase". Needs fix!`);
  } else if (wipCols2.includes('phase')) {
    console.log(`${OK} wip_cards column name matches code`);
  }

  // Check invoice_number trigger
  const invTrig = await pool.query(`SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'set_invoice_number'`);
  console.log(invTrig.rows.length ? `${OK} Invoice number auto-generation trigger exists` : `${FAIL} Invoice auto-number trigger MISSING`);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  AUDIT COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
  await prisma.$disconnect();
}

main().catch(async e => {
  console.error('Audit failed:', e.message);
  await pool.end();
  await prisma.$disconnect();
});
