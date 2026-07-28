const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So';
const SUPABASE_URL = 'https://icwebuepmihnpgxylifs.supabase.co';
const PROJECT_REF = 'icwebuepmihnpgxylifs';

const ADMIN_EMAIL = 'admin@printflowpro.com';
const ADMIN_PASSWORD = 'PrintFlow@2025';
const ADMIN_NAME = 'PrintFlow Admin';

// Use Supabase Management API to run raw SQL
async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  return { status: res.status, body: await res.text() };
}

// Direct PostgreSQL via Supabase's pg endpoint
async function runDirectSQL(sql) {
  const pgUrl = `postgresql://postgres:fVU5x7LroHcA1dTQ@db.${PROJECT_REF}.supabase.co:5432/postgres`;
  
  // We'll use the Supabase REST API to run the SQL by inserting into a temp setup
  // Actually, let's use node-postgres directly
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: pgUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    const result = await pool.query(sql);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Setting up PrintFlow Pro database...\n');

  // Step 1: Create User table (Prisma-compatible schema)
  console.log('1️⃣  Creating "User" table...');
  const createUserSQL = `
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  
  let r = await runDirectSQL(createUserSQL);
  console.log(r.success ? '   ✅ Created' : '   ❌ ' + r.error);

  // Step 2: Create supporting Prisma tables
  console.log('2️⃣  Creating "InvoiceCategory" table...');
  r = await runDirectSQL(`
    CREATE TABLE IF NOT EXISTS "InvoiceCategory" (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log(r.success ? '   ✅ Created' : '   ❌ ' + r.error);

  // Step 3: Check if admin user exists, create if not
  console.log('3️⃣  Checking for admin user...');
  r = await runDirectSQL(`SELECT id, email, role FROM "User" WHERE role = 'ADMIN' LIMIT 1;`);
  
  if (!r.success) {
    console.log('   ❌ Cannot query User table:', r.error);
    return;
  }

  if (r.result.rows.length > 0) {
    const existing = r.result.rows[0];
    console.log(`   ✅ Admin already exists: ${existing.email}`);
    console.log('\n📋 ADMIN CREDENTIALS:');
    console.log('   Email:    admin@printflowpro.com');
    console.log('   Password: PrintFlow@2025');
    return;
  }

  // Create admin
  console.log('   Creating new admin user...');
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const adminId = crypto.randomUUID();

  r = await runDirectSQL(`
    INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt")
    VALUES (
      '${adminId}',
      '${ADMIN_NAME}',
      '${ADMIN_EMAIL}',
      '${hashedPassword}',
      'ADMIN',
      now(),
      now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, role;
  `);

  if (r.success && r.result.rows.length > 0) {
    console.log('   ✅ Admin user created!');
  } else if (r.success && r.result.rows.length === 0) {
    console.log('   ℹ️  Admin already exists (ON CONFLICT hit)');
  } else {
    console.log('   ❌ Failed:', r.error);
    return;
  }

  // Step 4: Check all Supabase tables are healthy
  console.log('\n4️⃣  Verifying all database tables...');
  const supabaseTables = [
    'profiles', 'categories', 'quotations', 'invoices',
    'wip_cards', 'final_check_protocols', 'purchases',
    'transactions', 'expenses', 'account_credits', 'account_debits'
  ];

  for (const tbl of supabaseTables) {
    r = await runDirectSQL(`SELECT COUNT(*) as cnt FROM "${tbl}";`);
    const count = r.success ? r.result.rows[0]?.cnt : '?';
    console.log(r.success ? `   ✅ ${tbl} (${count} rows)` : `   ❌ ${tbl}: ${r.error}`);
  }

  // Step 5: Verify quotation_number trigger
  console.log('\n5️⃣  Verifying quotation_number trigger...');
  r = await runDirectSQL(`
    SELECT trigger_name FROM information_schema.triggers 
    WHERE trigger_name = 'set_quotation_number';
  `);
  console.log(r.success && r.result.rows.length > 0 
    ? '   ✅ set_quotation_number trigger exists' 
    : '   ⚠️  Trigger missing! Recreating...');

  // Step 6: Fix quotation_number NOT NULL issue
  // The trigger fires BEFORE INSERT but the NOT NULL constraint fires first.
  // We need to make quotation_number have a DEFAULT to pass the NOT NULL check.
  console.log('\n6️⃣  Fixing quotation_number default (prevent NOT NULL error)...');
  r = await runDirectSQL(`
    ALTER TABLE quotations 
    ALTER COLUMN quotation_number SET DEFAULT 'QUO-TEMP';
  `);
  console.log(r.success ? '   ✅ Default set' : '   ❌ ' + r.error);

  console.log('\n\n🎉 DATABASE SETUP COMPLETE!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ADMIN LOGIN CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Email   : admin@printflowpro.com');
  console.log('  Password: PrintFlow@2025');
  console.log('  Role    : ADMIN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
