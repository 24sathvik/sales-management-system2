const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://icwebuepmihnpgxylifs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const ADMIN_EMAIL = 'admin@printflowpro.com';
const ADMIN_PASSWORD = 'PrintFlow@2025';
const ADMIN_NAME = 'PrintFlow Admin';

async function createTables() {
  console.log('📦 Creating Prisma User table if not exists...');

  const createUserTable = `
    CREATE TABLE IF NOT EXISTS "User" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      "createdAt" TIMESTAMPTZ DEFAULT now(),
      "updatedAt" TIMESTAMPTZ DEFAULT now()
    );
  `;

  const { error: tableErr } = await supabase.rpc('exec_sql', { sql: createUserTable }).catch(() => ({ error: null }));
  
  // Try direct query approach for table creation
  const result = await fetch(`https://icwebuepmihnpgxylifs.supabase.co/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imljd2VidWVwbWlobnBneHlsaWZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg0MDgwMiwiZXhwIjoyMDkxNDE2ODAyfQ.IU4fGZWtj4-nq0aqYo4mMOQyJRCaFTQSbPbheywR5So',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql: createUserTable })
  });
  console.log('Table creation via RPC:', result.status, result.statusText);
}

async function ensureAdminUser() {
  console.log('\n👤 Checking/Creating admin user...');
  
  // Check if User table exists by trying to query it
  const { data: existingUsers, error: checkErr } = await supabase
    .from('User')
    .select('id, name, email, role')
    .limit(10);

  if (checkErr) {
    console.log('❌ User table issue:', checkErr.message);
    console.log('\n⚠️  The Prisma User table does NOT exist yet.');
    console.log('   You need to run: npx prisma migrate deploy or npx prisma db push');
    console.log('   But exclude the Supabase tables to avoid conflicts.');
    return;
  }

  console.log('✅ User table exists. Users found:', existingUsers?.length ?? 0);
  if (existingUsers?.length) {
    console.log('\nExisting users:');
    existingUsers.forEach(u => console.log(` - ${u.email} (${u.role})`));
  }

  // Check if admin exists
  const adminExists = existingUsers?.find(u => u.role === 'ADMIN');
  if (adminExists) {
    console.log('\n✅ Admin already exists:', adminExists.email);
    return;
  }

  // Hash password and create admin
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const { data: newUser, error: insertErr } = await supabase
    .from('User')
    .insert({
      id: require('crypto').randomUUID(),
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (insertErr) {
    console.log('❌ Failed to create admin:', insertErr.message);
  } else {
    console.log('\n✅ Admin user created successfully!');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Role:', newUser.role);
  }
}

async function checkSupabaseTables() {
  console.log('\n📊 Verifying Supabase data tables...');
  const tables = ['profiles', 'quotations', 'invoices', 'wip_cards', 'final_check_protocols', 'transactions', 'account_credits', 'account_debits', 'expenses', 'purchases', 'categories'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    const count = data?.length ?? 0;
    console.log(error ? `  ❌ ${table}: ${error.message}` : `  ✅ ${table} (accessible)`);
  }
}

async function main() {
  await checkSupabaseTables();
  await ensureAdminUser();
}

main().catch(console.error);
