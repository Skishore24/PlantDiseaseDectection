# LeafGuard AI — Training launcher (uses Python 3.12 venv with TensorFlow)
# Usage:  .\train.ps1
#         .\train.ps1 --epochs 15 --fine-tune

$ErrorActionPreference = "Stop"

$VENV_PY  = Join-Path $PSScriptRoot ".venv-tf\Scripts\python.exe"
$TRAIN_PY = Join-Path $PSScriptRoot "training\train_model.py"

if (-not (Test-Path $VENV_PY)) {
    Write-Error "TF venv not found at $VENV_PY — run setup first."
    exit 1
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host " LeafGuard AI — EfficientNetB0 Training Pipeline"   -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host " Python : $VENV_PY"
Write-Host " Script : $TRAIN_PY"
Write-Host "----------------------------------------------------"
Write-Host ""

& $VENV_PY $TRAIN_PY @args
