<#
Create Python virtual environment for ml_scorer and install requirements.
Run from repo root: .\scripts\setup-python-venv.ps1
#>
Set-StrictMode -Version Latest

$venvPath = "./ml_scorer/.venv"
if (-Not (Test-Path $venvPath)) {
    python -m venv $venvPath
}

Write-Output "Installing requirements into venv..."
# Detect Windows by environment variable
if ($env:OS -eq 'Windows_NT') {
    $pyExe = Join-Path $venvPath 'Scripts\python.exe'
    if (-Not (Test-Path $pyExe)) {
        Write-Warning "venv python not found at $pyExe. Trying 'python -m pip' fallback."
        python -m pip install --upgrade pip
        python -m pip install -r "ml_scorer\requirements.txt"
    } else {
        & $pyExe -m pip install --upgrade pip
        & $pyExe -m pip install -r "ml_scorer\requirements.txt"
    }
    Write-Output "Done. To run locally:"
    Write-Output "  cd ml_scorer"
    Write-Output "  . ./.venv/Scripts/Activate.ps1  # Windows PowerShell"
    Write-Output "  python scorer.py"
} else {
    $pyExe = Join-Path $venvPath 'bin/python'
    if (-Not (Test-Path $pyExe)) {
        & python -m pip install --upgrade pip
        & python -m pip install -r "ml_scorer/requirements.txt"
    } else {
        & $pyExe -m pip install --upgrade pip
        & $pyExe -m pip install -r "ml_scorer/requirements.txt"
    }
    Write-Output "Done. To run locally:"
    Write-Output "  cd ml_scorer"
    Write-Output "  source ./.venv/bin/activate  # Linux/macOS"
    Write-Output "  python scorer.py"
}
