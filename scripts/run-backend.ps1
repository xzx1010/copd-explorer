$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $python)) {
    throw "Root .venv is missing. Run .\scripts\setup.ps1 first."
}

Set-Location (Join-Path $repoRoot "backend")
& $python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
exit $LASTEXITCODE
