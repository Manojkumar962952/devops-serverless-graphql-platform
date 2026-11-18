# Script to build and package all Lambda functions into individual .zip files
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$root = "$PSScriptRoot\.."

Write-Host "1. Building Lambda bundles..." -ForegroundColor Cyan
Set-Location "$root\lambda"
node build.js

$functions = @("createEmployee", "getEmployees", "getEmployee", "updateEmployee", "deleteEmployee", "initDatabase")

Write-Host "`n2. Packaging into standalone zip files..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$root\lambda\zips" | Out-Null

foreach ($fn in $functions) {
    $src = "$root\lambda\dist\$fn\index.js"
    $zip = "$root\lambda\zips\$fn.zip"
    if (Test-Path $zip) { Remove-Item $zip -Force }
    Compress-Archive -Path $src -DestinationPath $zip -Force
    Write-Host "Created: lambda/zips/$fn.zip" -ForegroundColor Green
}

Write-Host "`nAll Lambda zip packages ready in lambda/zips/ folder!" -ForegroundColor Green
Set-Location $root
