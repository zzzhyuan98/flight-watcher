$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $scriptDir '.env'

if (!(Test-Path $envFile)) {
  Write-Error "Missing .env at $envFile. Copy .env.example to .env and fill values."
}

# Load KEY=VALUE pairs
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_ -split '=', 2
  if ($parts.Count -eq 2) {
    $k = $parts[0].Trim()
    $v = $parts[1].Trim()
    [System.Environment]::SetEnvironmentVariable($k, $v)
  }
}

if (-not $env:DSA_REPO_PATH) { throw 'DSA_REPO_PATH is required in .env' }
if (-not (Test-Path $env:DSA_REPO_PATH)) { throw "DSA_REPO_PATH not found: $env:DSA_REPO_PATH" }
if (-not $env:DSA_RUN_CMD) { $env:DSA_RUN_CMD = 'python main.py' }

Write-Host "[1/2] Running daily_stock_analysis..."
Push-Location $env:DSA_REPO_PATH
try {
  cmd /c $env:DSA_RUN_CMD
  if ($LASTEXITCODE -ne 0) { throw "daily_stock_analysis failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

Write-Host "[2/2] Sending latest report to Telegram..."
python (Join-Path $scriptDir 'send_report.py')
if ($LASTEXITCODE -ne 0) { throw "send_report.py failed with exit code $LASTEXITCODE" }

Write-Host "Done."
