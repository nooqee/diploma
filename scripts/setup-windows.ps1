<#
Setup prerequisites on Windows using winget when possible.
This script attempts to install Docker Desktop, Python, Go and Git via winget.
Run as Administrator if you want winget to install packages.

Usage: Open PowerShell as Admin and run:
  .\scripts\setup-windows.ps1

If winget is not available the script prints manual instructions.
#>
Set-StrictMode -Version Latest
Write-Output "== Prerequisite installer for Windows (winget) =="

function Check-Command($name) {
    $p = Get-Command $name -ErrorAction SilentlyContinue
    return $null -ne $p
}

if (-not (Check-Command winget)) {
    Write-Warning "winget not found. Please install App Installer from Microsoft Store or install packages manually."
    Write-Output "Manual install links:"
    Write-Output "- Docker Desktop: https://www.docker.com/get-started"
    Write-Output "- Python: https://www.python.org/downloads/windows/"
    Write-Output "- Go: https://go.dev/dl/"
    Write-Output "- Git: https://git-scm.com/download/win"
    exit 1
}

Write-Output "winget found. Installing prerequisites (may prompt for UAC)..."

$packages = @(
    @{id='Docker.DockerDesktop'; name='Docker Desktop'},
    @{id='Python.Python.3'; name='Python 3'},
    @{id='GoLang.Go'; name='Go'},
    @{id='Git.Git'; name='Git'}
)

foreach ($pkg in $packages) {
    Write-Output "Installing $($pkg.name) ($($pkg.id))..."
    try {
        winget install --id $pkg.id -e --accept-package-agreements --accept-source-agreements
    } catch {
        Write-Warning "Failed to install $($pkg.name) via winget. Please install manually."
    }
}

Write-Output "Done. Please restart your terminal and ensure Docker Desktop is running before proceeding."
