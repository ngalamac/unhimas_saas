# PowerShell wrapper for run_full_checks.js
param()
$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Join-Path $scriptDir '..'
Set-Location $root
Write-Host "Running full checks..."
node .\scripts\run_full_checks.js
Write-Host "Done. Log: check-results.log"
