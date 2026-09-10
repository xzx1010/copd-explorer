[CmdletBinding()]
param(
    [string]$PythonExecutable = "python",
    [string]$NodeExecutable = "node",
    [string]$NpmExecutable = "npm",
    [switch]$Recreate,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$venvPath = Join-Path $repoRoot ".venv"
$venvPython = Join-Path $venvPath "Scripts\python.exe"
$backendLegacyVenv = Join-Path $repoRoot "backend\.venv"
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

function Get-CommandVersion {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    $output = & $FilePath @Arguments 2>&1
    $value = ($output | Select-Object -First 1).ToString().Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to read version from $FilePath"
    }
    return $value
}

Write-Host "Checking toolchain versions..." -ForegroundColor Cyan

$pythonCommand = Get-Command $PythonExecutable -ErrorAction Stop
$pythonVersion = Get-CommandVersion $pythonCommand.Source @("--version")
if ($pythonVersion -ne "Python 3.12.13") {
    throw "Python 3.12.13 is required; found '$pythonVersion'. Use -PythonExecutable to select it."
}

$nodeCommand = Get-Command $NodeExecutable -ErrorAction Stop
$nodeVersion = Get-CommandVersion $nodeCommand.Source @("--version")
if ($nodeVersion -ne "v24.14.0") {
    throw "Node.js 24.14.0 is required; found '$nodeVersion'."
}

$npmCommand = Get-Command $NpmExecutable -ErrorAction SilentlyContinue
if (-not $npmCommand -and $NpmExecutable -eq "npm") {
    $npmCommand = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
}
if (-not $npmCommand) {
    throw "npm was not found. Install Node.js 24.14.0 with npm 11.19.0, or use -NpmExecutable."
}
$npmVersion = Get-CommandVersion $npmCommand.Source @("--version")
if ($npmVersion -ne "11.19.0") {
    throw "npm 11.19.0 is required; found '$npmVersion'. Run: npm install --global npm@11.19.0"
}

if (Test-Path -LiteralPath $backendLegacyVenv) {
    Write-Warning "backend/.venv is deprecated and will not be used. The project uses the root .venv only."
}

if ($Recreate -and (Test-Path -LiteralPath $venvPath)) {
    $resolvedVenv = (Resolve-Path -LiteralPath $venvPath).Path
    $expectedVenv = [IO.Path]::GetFullPath($venvPath)
    if ($resolvedVenv -ne $expectedVenv) {
        throw "Refusing to remove unexpected virtual environment: $resolvedVenv"
    }
    Write-Host "Removing existing root .venv..."
    Remove-Item -LiteralPath $resolvedVenv -Recurse -Force
}

if (-not (Test-Path -LiteralPath $venvPython)) {
    Write-Host "Creating root .venv..." -ForegroundColor Cyan
    Invoke-Checked $pythonCommand.Source "-m" "venv" $venvPath
}

$createdPythonVersion = Get-CommandVersion $venvPython @("--version")
if ($createdPythonVersion -ne "Python 3.12.13") {
    throw "The root .venv uses '$createdPythonVersion'; rerun setup with -Recreate."
}

Write-Host "Installing locked Python dependencies..." -ForegroundColor Cyan
Invoke-Checked $venvPython "-m" "pip" "install" "--disable-pip-version-check" "-r" (Join-Path $repoRoot "backend\requirements-lock.txt")

Write-Host "Installing locked frontend dependencies with npm ci..." -ForegroundColor Cyan
Push-Location $frontendPath
try {
    Invoke-Checked $npmCommand.Source "ci"
} finally {
    Pop-Location
}

$backendEnv = Join-Path $repoRoot "backend\.env"
if (-not (Test-Path -LiteralPath $backendEnv)) {
    Copy-Item -LiteralPath (Join-Path $repoRoot "backend\.env.example") -Destination $backendEnv
    Write-Host "Created backend/.env from .env.example."
}

$frontendEnv = Join-Path $frontendPath ".env"
if (-not (Test-Path -LiteralPath $frontendEnv)) {
    Copy-Item -LiteralPath (Join-Path $frontendPath ".env.example") -Destination $frontendEnv
    Write-Host "Created frontend/.env from .env.example."
}

if (-not $SkipVerify) {
    & (Join-Path $PSScriptRoot "verify.ps1") -NpmExecutable $npmCommand.Source
    if ($LASTEXITCODE -ne 0) {
        throw "Environment setup completed, but verification failed."
    }
}

Write-Host "Environment is ready." -ForegroundColor Green
Write-Host "Start the backend with:  .\scripts\run-backend.ps1"
Write-Host "Start the frontend with: .\scripts\run-frontend.ps1"
