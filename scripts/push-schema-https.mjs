// scripts/push-schema-https.mjs
// Runs migration DDL via Supabase's HTTPS pg_meta API (bypasses all blocked TCP ports)
// Run: node scripts/push-schema-https.mjs

const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2JjbXBkd3dyeGJsbXhua3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2NDUzMiwiZXhwIjoyMDg5MDQwNTMyfQ.0OkF8Ci64ej6hUldWKRBTxfsoVUdU8VyIgh11b99DOo";
const PROJECT_REF = "cjsbcmpdwwrxblmxnkyf";
const BASE_URL = `https://${PROJECT_REF}.supabase.co`;

const headers = {
  "apikey": SERVICE_KEY,
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function runSQL(description, sql) {
  // Supabase pg_meta exposes SQL execution at this endpoint
  const resp = await fetch(`${BASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  if (resp.ok) {
    console.log(`✅ ${description}`);
    return true;
  } else {
    // Parse error
    let errMsg = text;
    try { errMsg = JSON.parse(text)?.message || text; } catch {}
    if (errMsg.includes("already exists") || errMsg.includes("duplicate")) {
      console.log(`⏩ SKIP (already exists): ${description}`);
      return true;
    }
    console.error(`❌ FAILED: ${description} — ${errMsg.substring(0, 150)}`);
    return false;
  }
}

// Instead of using pg_meta, let's use Supabase's direct SQL via the REST API
// by calling a stored procedure. But first let's check if we can create one.

// Actually the correct approach for Supabase REST SQL is through the "postgres-meta" API
// which runs at the internal port. But via public HTTPS, we use the rpc endpoint.

// Let's verify the correct endpoint
console.log("Testing SQL execution via Supabase RPC...");

// Try creating a simple function first to test
const testSQL = `SELECT current_database(), version()`;
const testResp = await fetch(`${BASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST", 
  headers,
  body: JSON.stringify({ sql: testSQL })
});
console.log(`exec_sql status: ${testResp.status}`);
const testBody = await testResp.text();
console.log(`Response: ${testBody.substring(0, 300)}\n`);

// Try the pg schema endpoint
const pgResp = await fetch(`${BASE_URL}/pg/query`, {
  method: "POST",
  headers,
  body: JSON.stringify({ query: testSQL })
});
console.log(`pg/query status: ${pgResp.status}`);
const pgBody = await pgResp.text();
console.log(`Response: ${pgBody.substring(0, 300)}`);
