<#
Check Atlas connectivity: runs DNS/SRV resolution, TCP tests, proxy/env checks,
and attempts a MongoDB driver ping using project's dependencies.
Run from backend folder with:
  powershell -ExecutionPolicy Bypass -File .\scripts\check-atlas.ps1
#>

Write-Host "=== START: Atlas connectivity checks ===`n"

Write-Host "-- 1) nslookup A/AAAA for cluster host --"
nslookup dbvale.chv7pdf.mongodb.net

Write-Host "`n-- 2) nslookup SRV record for _mongodb._tcp.dbvale.chv7pdf.mongodb.net --"
nslookup -type=srv _mongodb._tcp.dbvale.chv7pdf.mongodb.net

Write-Host "`n-- 3) SRV resolve via Node (dns.resolveSrv) --"
if (Get-Command node -ErrorAction SilentlyContinue) {
    node -e "dns=require('dns').promises; dns.resolveSrv('_mongodb._tcp.dbvale.chv7pdf.mongodb.net').then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e); process.exit(1)})"
} else {
    Write-Host "node not found in PATH; skipping Node SRV test"
}

Write-Host "`n-- 4) Test-NetConnection to each shard (TCP) --"
$hosts = @(
    'ac-jhyajnr-shard-00-00.chv7pdf.mongodb.net',
    'ac-jhyajnr-shard-00-01.chv7pdf.mongodb.net',
    'ac-jhyajnr-shard-00-02.chv7pdf.mongodb.net'
)
foreach ($h in $hosts) {
    Write-Host "`nTesting $h:"
    Test-NetConnection -ComputerName $h -Port 27017 -InformationLevel Detailed
}

Write-Host "`n-- 5) Proxy env vars (HTTP(S)_PROXY) --"
Get-ChildItem Env:HTTP_PROXY,Env:HTTPS_PROXY,Env:http_proxy,Env:https_proxy | Format-List

Write-Host "`n-- 6) Hosts file (first 200 lines) --"
if (Test-Path C:\Windows\System32\drivers\etc\hosts) {
    Get-Content C:\Windows\System32\drivers\etc\hosts -TotalCount 200
} else { Write-Host "hosts file not found" }

Write-Host "`n-- 7) Firewall rules referencing 27017 or mongodb --"
Get-NetFirewallRule -Direction Outbound | Where-Object { ($_.DisplayName -match '27017') -or ($_.DisplayName -match 'mongodb') -or ($_.DisplayName -match 'Mongo') } | Format-Table DisplayName, Enabled -AutoSize

Write-Host "`n-- 8) Node / Yarn versions --"
if (Get-Command node -ErrorAction SilentlyContinue) { node -v } else { Write-Host "node not found" }
if (Get-Command yarn -ErrorAction SilentlyContinue) { yarn -v } else { Write-Host "yarn not found" }

Write-Host "`n-- 9) Read MONGODB_URI from .env (backend/.env) --"
$envPath = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envPath) {
    Write-Host "Found .env at: $envPath"
    Get-Content $envPath | Select-String -Pattern 'MONGODB_URI' -SimpleMatch
    # export for node test
    $line = Get-Content $envPath | Where-Object { $_ -match '^\s*MONGODB_URI\s*=\s*' }
    if ($line) {
        $val = $line -replace '^\s*MONGODB_URI\s*=\s*',''
        # trim possible quotes
        $val = $val.Trim("'\"")
        Write-Host "Exporting MONGODB_URI env var for the test (masked):"
        Write-Host ($val.Substring(0,[Math]::Min(60,$val.Length)) + '...')
        $env:MONGODB_URI = $val
    } else { Write-Host "MONGODB_URI not found in .env" }
} else { Write-Host ".env not found at $envPath" }

Write-Host "`n-- 10) Attempt MongoDB driver connect using project dependencies --"
# create a temporary JS test file in the scripts folder
$testJs = Join-Path $PSScriptRoot 'test-connect.js'
$js = @'
const { MongoClient } = require('mongodb');
(async()=>{
  try{
    const uri = process.env.MONGODB_URI;
    if(!uri){ console.error('MONGODB_URI not set'); process.exit(2); }
    console.log('Using URI (masked):', uri.substring(0,80)+'...');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
    await client.connect();
    console.log('Connected. Ping:');
    const res = await client.db('admin').command({ ping: 1 });
    console.log(JSON.stringify(res, null, 2));
    await client.close();
    process.exit(0);
  } catch (e) {
    console.error('CONNECT ERROR:');
    console.error(e);
    process.exit(1);
  }
})();
'@
Set-Content -Path $testJs -Value $js -Encoding UTF8

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Running Node test-connect.js (this uses backend/node_modules if present)"
    Push-Location $PSScriptRoot\..\
    $nodeExe = (Get-Command node).Source
    # run with project's node environment
    & $nodeExe $testJs
    Pop-Location
} else {
    Write-Host "Node not found; skipping Node driver test"
}

Write-Host "`n=== END: checks ==="

Write-Host "
Por favor cole toda a saída aqui. Se quiser eu analiso e sugiro os próximos passos."