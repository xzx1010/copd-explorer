$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $repoRoot "frontend"

$npmCommand = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    $npmCommand = Get-Command "npm" -ErrorAction Stop
}

Set-Location $frontendPath
& $npmCommand.Source run dev -- --host 127.0.0.1 --port 5173
exit $LASTEXITCODE
