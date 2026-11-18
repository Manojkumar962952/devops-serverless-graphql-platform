# Local Environment & Codebase Validation Script (PowerShell)
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "DevOps Assessment: Codebase & Build Validation" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = Get-Location

# 1. Lambda functions
Write-Host "`n[1/3] Validating Lambda Functions..." -ForegroundColor Yellow
Set-Location "$root\lambda"
npm install
npm run typecheck
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Lambda build failed"; exit 1 }

# 2. Backend GraphQL Server
Write-Host "`n[2/3] Validating Backend GraphQL Server..." -ForegroundColor Yellow
Set-Location "$root\backend"
npm install
npm run typecheck
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# 3. Frontend React App
Write-Host "`n[3/3] Validating React Frontend Application..." -ForegroundColor Yellow
Set-Location "$root\frontend"
npm install
npm run typecheck
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

Set-Location $root
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " All builds, typechecks, and bundles succeeded with 0 errors!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
