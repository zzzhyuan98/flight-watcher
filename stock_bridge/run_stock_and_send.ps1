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
if (-not $env:DSA_RUN_CMD) { $env:DSA_RUN_CMD = 'main.py' }

function Resolve-PythonCmd {
  if (Get-Command py -ErrorAction SilentlyContinue) { return 'py' }

  $known = @(
    "$env:LOCALAPPDATA\Programs\Python\Python313\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python310\python.exe"
  )
  foreach ($p in $known) { if (Test-Path $p) { return $p } }

  $pyCmd = Get-Command python -ErrorAction SilentlyContinue
  if ($pyCmd -and $pyCmd.Source -notmatch 'WindowsApps') { return 'python' }

  throw 'Python runtime not found. Install Python (with py launcher) and try again.'
}

$pythonCmd = Resolve-PythonCmd

Write-Host "[1/2] Running daily_stock_analysis..."
Push-Location $env:DSA_REPO_PATH
try {
  $runCmd = $env:DSA_RUN_CMD.Trim()

  if ($runCmd -match '^(python|py)\s+(.+)$') {
    $scriptArgs = $Matches[2]
    cmd /c "`"$pythonCmd`" $scriptArgs"
  } elseif ($runCmd -match '^main\.py(\s+.*)?$') {
    cmd /c "`"$pythonCmd`" $runCmd"
  } else {
    cmd /c $runCmd
  }

  if ($LASTEXITCODE -ne 0) { throw "daily_stock_analysis failed with exit code $LASTEXITCODE" }
} finally {
  Pop-Location
}

Write-Host "[2/2] Sending latest report to Telegram..."
& $pythonCmd (Join-Path $scriptDir 'send_report.py')
if ($LASTEXITCODE -ne 0) { throw "send_report.py failed with exit code $LASTEXITCODE" }

Write-Host "Done."
