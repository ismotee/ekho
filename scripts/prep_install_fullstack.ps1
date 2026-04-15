$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Refresh-Path {
    $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"
}

function Ensure-Winget {
    if (-not (Test-Command "winget")) {
        throw "winget is required to auto-install runtimes. Install App Installer from Microsoft Store, then rerun."
    }
}

function Install-WithWinget {
    param(
        [string]$PackageId,
        [string]$Label
    )

    Write-Step "Installing $Label via winget ($PackageId)"
    winget install --id $PackageId --exact --accept-package-agreements --accept-source-agreements
}

function Ensure-Python {
    if (Test-Command "python" -or Test-Command "py") {
        Write-Host "Python found."
        return
    }

    Ensure-Winget
    Install-WithWinget -PackageId "Python.Python.3.12" -Label "Python 3.12"
    Refresh-Path

    if (-not (Test-Command "python") -and -not (Test-Command "py")) {
        throw "Python install completed but command is still unavailable. Open a new shell and rerun."
    }
}

function Ensure-Node {
    if (Test-Command "node" -and Test-Command "npm") {
        Write-Host "Node.js and npm found."
        return
    }

    Ensure-Winget
    Install-WithWinget -PackageId "OpenJS.NodeJS.LTS" -Label "Node.js LTS"
    Refresh-Path

    if (-not (Test-Command "node") -or -not (Test-Command "npm")) {
        throw "Node.js install completed but node/npm commands are still unavailable. Open a new shell and rerun."
    }
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$BackendScript = Join-Path $RepoRoot "backend\scripts\prep_install.ps1"
$FrontendDir = Join-Path $RepoRoot "frontend"

if (-not (Test-Path $BackendScript)) {
    throw "Expected backend installer not found at $BackendScript"
}

if (-not (Test-Path $FrontendDir)) {
    throw "Expected frontend directory not found at $FrontendDir"
}

Write-Step "Checking required runtimes"
Ensure-Python
Ensure-Node

Write-Step "Installing backend dependencies and first-run setup"
& $BackendScript

Write-Step "Installing frontend dependencies"
Push-Location $FrontendDir
try {
    npm install
}
finally {
    Pop-Location
}

Write-Step "All done"
Write-Host "Backend and frontend dependencies are installed."
Write-Host "Start backend: backend\scripts\prep_start.bat"
Write-Host "Start frontend: cd frontend && npm run dev"
