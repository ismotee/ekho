# One-shot prep install for Windows PowerShell: Poetry or venv + pip, then .env / migrate / optional seed.
# Usage: pwsh -ExecutionPolicy Bypass -File path\to\backend\scripts\prep_install.ps1
# Working directory does not matter; the script switches to the backend root (parent of scripts/).
#
# Environment:
#   $env:PREP_NO_POETRY = "1"  — force venv + pip even if Poetry is installed.
#   $env:PREP_SEED_CATALOG = "1" — run seed_exhibit_catalog after migrate.

$ErrorActionPreference = "Stop"

$BackendRoot = Split-Path -Parent $PSScriptRoot
Set-Location $BackendRoot

if (-not (Test-Path (Join-Path $BackendRoot ".env.example"))) {
    Write-Error "missing .env.example in $BackendRoot"
}

$usePoetry = $false
if ($env:PREP_NO_POETRY -ne "1" -and (Get-Command poetry -ErrorAction SilentlyContinue) -and (Test-Path (Join-Path $BackendRoot "pyproject.toml"))) {
    $usePoetry = $true
}

if ($usePoetry) {
    Write-Host "Installing dependencies with Poetry..."
    poetry install
}
else {
    $venvDir = Join-Path $BackendRoot "venv"
    if (-not (Test-Path $venvDir)) {
        Write-Host "Creating venv at $venvDir ..."
        python -m venv $venvDir
    }
    $venvPy = Join-Path $venvDir "Scripts\python.exe"
    $venvPip = Join-Path $venvDir "Scripts\pip.exe"
    Write-Host "Installing dependencies with pip (venv)..."
    & $venvPy -m pip install --upgrade pip
    & $venvPip install -r (Join-Path $BackendRoot "requirements.txt")
}

if (-not (Test-Path (Join-Path $BackendRoot ".env"))) {
    Copy-Item (Join-Path $BackendRoot ".env.example") (Join-Path $BackendRoot ".env")
    Write-Host "Created .env from .env.example — edit SECRET_KEY and other values as needed."
}

function Invoke-PrepPython {
    param([string[]]$ArgumentList)
    if ($usePoetry) {
        & poetry run python @ArgumentList
    }
    else {
        & (Join-Path $BackendRoot "venv\Scripts\python.exe") @ArgumentList
    }
}

$dsmScript = @'
from pathlib import Path
from dotenv import dotenv_values
import sys
root = Path(sys.argv[1])
p = root / ".env"
d = dotenv_values(p) if p.exists() else {}
v = d.get("DJANGO_SETTINGS_MODULE")
print(v.strip() if v and str(v).strip() else "", end="")
'@

$dsm = Invoke-PrepPython -ArgumentList @("-c", $dsmScript, $BackendRoot)
if ($dsm) {
    $env:DJANGO_SETTINGS_MODULE = $dsm.Trim()
    Write-Host "DJANGO_SETTINGS_MODULE=$($env:DJANGO_SETTINGS_MODULE) (from .env)"
}

$secretScript = @'
from pathlib import Path
from dotenv import dotenv_values
import sys
root = Path(sys.argv[1])
d = dotenv_values(root / ".env")
sk = d.get("SECRET_KEY")
s = (sk or "").strip()
if not s or s == "django-insecure-change-this-in-production":
    print("Reminder: set a unique SECRET_KEY in .env before any shared or public use.")
'@

Invoke-PrepPython -ArgumentList @("-c", $secretScript, $BackendRoot)
Invoke-PrepPython -ArgumentList @("manage.py", "migrate")

if ($env:PREP_SEED_CATALOG -eq "1") {
    Write-Host "Running seed_exhibit_catalog (PREP_SEED_CATALOG=1)..."
    Invoke-PrepPython -ArgumentList @("manage.py", "seed_exhibit_catalog")
}
else {
    Write-Host "Skipping seed_exhibit_catalog. To run: `$env:PREP_SEED_CATALOG='1'; .\scripts\prep_install.ps1"
}

Write-Host "Next: createsuperuser — poetry run python manage.py createsuperuser (or venv\Scripts\python.exe manage.py createsuperuser)"
Write-Host "Then start: .\scripts\prep_start.bat or .\scripts\prep_start_production.bat"
