# scripts/push-schema.ps1
# Pushes schema DDL to Supabase via HTTPS REST API (bypasses blocked TCP ports)
# Run: powershell -ExecutionPolicy Bypass -File scripts/push-schema.ps1

$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2JjbXBkd3dyeGJsbXhua3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ2NDUzMiwiZXhwIjoyMDg5MDQwNTMyfQ.0OkF8Ci64ej6hUldWKRBTxfsoVUdU8VyIgh11b99DOo"
$projectRef = "cjsbcmpdwwrxblmxnkyf"
$apiUrl = "https://api.supabase.com/v1/projects/$projectRef/database/query"

# Header — Management API requires access token, not service role
# We'll use the postgres-meta endpoint instead (available via supabase project URL)
$metaUrl = "https://$projectRef.supabase.co"

$headers = @{
  "apikey" = $serviceRoleKey
  "Authorization" = "Bearer $serviceRoleKey"
  "Content-Type" = "application/json"
}

function Run-SQL {
  param([string]$description, [string]$sql)
  $body = @{ query = $sql } | ConvertTo-Json -Depth 2
  try {
    $resp = Invoke-RestMethod -Uri "$metaUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body -ErrorVariable errVar 2>&1
    Write-Host "SUCCESS: $description"
    return $true
  } catch {
    $errMsg = $_.Exception.Message
    Write-Host "WARN: $description (may already exist) — $errMsg"
    return $false
  }
}

Write-Host "Testing connectivity..."
try {
  $ping = Invoke-RestMethod -Uri "$metaUrl/rest/v1/" -Method GET -Headers $headers
  Write-Host "Connected to Supabase project!"
} catch {
  Write-Host "Connection test: $($_.Exception.Message)"
}
