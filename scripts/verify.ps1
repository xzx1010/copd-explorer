[CmdletBinding()]
param(
    [string]$NpmExecutable = "npm",
    [switch]$IncludeE2E
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
$frontendPath = Join-Path $repoRoot "frontend"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed ($LASTEXITCODE): $FilePath $($Arguments -join ' ')"
    }
}

if (-not (Test-Path -LiteralPath $venvPython)) {
    throw "Root .venv is missing. Run .\scripts\setup.ps1 first."
}

$npmCommand = Get-Command $NpmExecutable -ErrorAction SilentlyContinue
if (-not $npmCommand -and $NpmExecutable -eq "npm") {
    $npmCommand = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
}
if (-not $npmCommand) {
    throw "npm was not found. Run setup after installing the fixed Node.js/npm toolchain."
}

Write-Host "Verifying backend..." -ForegroundColor Cyan
Push-Location (Join-Path $repoRoot "backend")
try {
    Invoke-Checked $venvPython "-m" "pytest" "app/tests" "-q" "-p" "no:cacheprovider"
    Invoke-Checked $venvPython "-m" "ruff" "check" "app" "--no-cache"
    Invoke-Checked $venvPython "-m" "mypy" "app" "--no-incremental"
    Invoke-Checked $venvPython "-m" "compileall" "-q" "app"
} finally {
    Pop-Location
}

Write-Host "Verifying frontend..." -ForegroundColor Cyan
Push-Location $frontendPath
try {
    Invoke-Checked $npmCommand.Source "run" "typecheck"
    Invoke-Checked $npmCommand.Source "run" "lint"
    Invoke-Checked $npmCommand.Source "test"
    Invoke-Checked $npmCommand.Source "run" "build"
    if ($IncludeE2E) {
        Invoke-Checked $npmCommand.Source "run" "test:e2e"
    }
} finally {
    Pop-Location
}

Write-Host "All requested checks passed." -ForegroundColor Green
