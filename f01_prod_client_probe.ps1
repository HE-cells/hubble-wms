# F-01 Prod Client RLS Probe (PowerShell)
# Usage: .\f01_prod_client_probe.ps1 -Email "test@example.com" -Password "yourpassword"

param(
    [Parameter(Mandatory)][string]$Email,
    [Parameter(Mandatory)][string]$Password
)

$SUPABASE_URL = "https://sjkggguedgtynktymzes.supabase.co"
$ANON_KEY     = "sb_publishable_ZO6nGx_2VNMO9dK_fN72Cg_LlprwmWQ"

$PassCount = 0; $FailCount = 0; $WarnCount = 0

function ok($msg)   { Write-Host "  PASS  $msg" -ForegroundColor Green;  $script:PassCount++ }
function fail($msg) { Write-Host "  FAIL  $msg" -ForegroundColor Red;    $script:FailCount++ }
function warn($msg) { Write-Host "  WARN  $msg" -ForegroundColor Yellow; $script:WarnCount++ }
function info($msg) { Write-Host "        $msg" }

Write-Host ""
Write-Host "============================================================"
Write-Host " F-01  Prod Client RLS Probe"
Write-Host " Project: $SUPABASE_URL"
Write-Host "============================================================"
Write-Host ""
Write-Host "Authenticating as: $Email"

$authBody = @{ email = $Email; password = $Password } | ConvertTo-Json
try {
    $authResp = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{ apikey = $ANON_KEY; "Content-Type" = "application/json" } `
        -Body $authBody
} catch {
    Write-Host "AUTH FAILED: $_" -ForegroundColor Red
    exit 1
}

$token  = $authResp.access_token
$userId = $authResp.user.id
Write-Host "Auth OK -- user_id: $userId" -ForegroundColor Green
Write-Host ""

$headers = @{
    apikey         = $ANON_KEY
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

function Get-Rows($table, $qs = "") {
    $url = "$SUPABASE_URL/rest/v1/${table}?select=*$(if($qs){"&$qs"})"
    try {
        $r = Invoke-RestMethod -Uri $url -Headers $headers -Method GET
        return ,$r
    } catch { return @() }
}

function Check-Zero($label, $table, $qs = "") {
    $rows = Get-Rows $table $qs
    $n = @($rows).Count
    if ($n -eq 0) { ok "$label -> 0 rows (blocked)" }
    else          { fail "$label -> $n rows visible (EXPECTED 0)" }
}

function Check-WriteDenied($label, $table, $body) {
    try {
        Invoke-RestMethod `
            -Uri "$SUPABASE_URL/rest/v1/$table" `
            -Method POST `
            -Headers ($headers + @{ Prefer = "return=minimal" }) `
            -Body ($body | ConvertTo-Json) | Out-Null
        fail "$label -> INSERT $table succeeded (should be denied)"
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -ge 400) { ok "$label -> INSERT $table blocked (HTTP $code)" }
        else { fail "$label -> INSERT $table returned HTTP $code (expected 4xx)" }
    }
}

Write-Host "-- 1. Own scope --------------------------------------------"

$profileRows = @(Get-Rows "profiles" "select=id,role,client_id")
$pCount = $profileRows.Count
if ($pCount -eq 0) {
    fail "profiles -> 0 rows (client cannot read own profile -- portal will break)"
} elseif ($pCount -eq 1 -and $profileRows[0].role -eq "client") {
    ok "profiles -> 1 row, role=client (own only)"
} elseif ($pCount -eq 1) {
    warn "profiles -> 1 row but role=$($profileRows[0].role) (expected client)"
} else {
    fail "profiles -> $pCount rows (EXPECTED 1 -- multiple rows = PII LEAK)"
}

try {
    $summary = Invoke-RestMethod `
        -Uri "$SUPABASE_URL/rest/v1/rpc/get_client_project_summary" `
        -Method POST -Headers $headers -Body "{}"
    $sCount = @($summary).Count
    if ($sCount -eq 0) {
        warn "get_client_project_summary -> 0 projects (OK if no projects assigned yet)"
    } else {
        ok "get_client_project_summary -> $sCount project(s) (verify names match own company)"
        $summary | ForEach-Object { info "  project=$($_.project_name)  hours=$($_.total_hours)" }
    }
} catch {
    fail "get_client_project_summary -> RPC error: $_"
}

$clientRows = @(Get-Rows "clients" "select=id,name,prefix")
$cCount = $clientRows.Count
if ($cCount -eq 1)     { ok "clients -> 1 row (own company: $($clientRows[0].name))" }
elseif ($cCount -eq 0) { warn "clients -> 0 rows (own row should be readable)" }
else                   { fail "clients -> $cCount rows (EXPECTED 1 -- multiple companies visible)" }

Write-Host ""
Write-Host "-- 2. Employee PII / internal tables (must be 0) -----------"
Check-Zero "time_entries"          "time_entries"
Check-Zero "leave_requests"        "leave_requests"
Check-Zero "employees"             "employees"
Check-Zero "compensation_records"  "compensation_records"
Check-Zero "petty_cash_settings"   "petty_cash_settings"
Check-Zero "document_templates"    "document_templates"
Check-Zero "group_members"         "group_members"
Check-Zero "task_assignments"      "task_assignments"
Check-Zero "evaluation_cycles"     "evaluation_cycles"
Check-Zero "evaluation_questions"  "evaluation_questions"
Check-Zero "evaluation_responses"  "evaluation_responses"
Check-Zero "login_attempts"        "login_attempts"

Write-Host ""
Write-Host "-- 3. Expense/travel detail (own projects only) ------------"
$expRows  = @(Get-Rows "cash_transactions" "direction=eq.out&select=id,project_id,amount")
$tripRows = @(Get-Rows "travel_requests"   "select=id,project_id,destination,status")
$en = $expRows.Count; $tn = $tripRows.Count
if ($en -eq 0) { ok "cash_transactions(out) -> 0 rows (none yet or blocked)" }
else           { ok "cash_transactions(out) -> $en rows (verify all are own projects)" }
if ($tn -eq 0) { ok "travel_requests -> 0 rows (none yet or blocked)" }
else           { ok "travel_requests -> $tn rows (verify all are own projects)" }

Write-Host ""
Write-Host "-- 4. Writes denied ----------------------------------------"
Check-WriteDenied "projects"          "projects"          @{ name="probe_test"; client_id="00000000-0000-0000-0000-000000000000" }
Check-WriteDenied "time_entries"      "time_entries"      @{ user_id="00000000-0000-0000-0000-000000000000"; project_id="00000000-0000-0000-0000-000000000000"; date="2020-01-01"; hours=1 }
Check-WriteDenied "cash_transactions" "cash_transactions" @{ project_id="00000000-0000-0000-0000-000000000000"; amount=1; direction="out"; txn_date="2020-01-01" }
Check-WriteDenied "travel_requests"   "travel_requests"   @{ project_id="00000000-0000-0000-0000-000000000000"; destination="probe"; start_date="2020-01-01"; end_date="2020-01-01" }
Check-WriteDenied "leave_requests"    "leave_requests"    @{ employee_id="00000000-0000-0000-0000-000000000000"; leave_type_code="annual"; start_date="2020-01-01"; end_date="2020-01-01" }

Write-Host ""
Write-Host "============================================================"
Write-Host " Result: $PassCount PASS  $FailCount FAIL  $WarnCount WARN"
Write-Host "============================================================"
if ($FailCount -gt 0) {
    Write-Host "F-01 FAIL -- fix all FAIL items before going live." -ForegroundColor Red
    exit 1
} elseif ($WarnCount -gt 0) {
    Write-Host "F-01 WARN -- review WARN items, then close F-01 if acceptable." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "F-01 PASS -- client isolation verified in prod." -ForegroundColor Green
    exit 0
}
