# Packaging script for SEOscoper Mozilla Firefox Extension
# Produces standard UNIX-compliant ZIP with forward slashes (/) for Mozilla Firefox & AMO

$sourceDir = $PSScriptRoot
$outputZip = Join-Path (Split-Path $sourceDir -Parent) "seoscoper-firefox-v2.0.2.zip"

Write-Host "Packaging SEOscoper Firefox Extension..." -ForegroundColor Cyan

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($outputZip, [System.IO.Compression.ZipArchiveMode]::Create)

$files = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object { 
    $_.Name -ne 'package.ps1' -and 
    $_.Name -ne 'README.md' -and 
    $_.Name -ne 'AMO_LISTING.md' 
}

foreach ($file in $files) {
    # Ensure all paths in ZIP use UNIX forward slashes / instead of Windows backslashes \
    $relativePath = $file.FullName.Substring($sourceDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath)
}

$zip.Dispose()

if (Test-Path $outputZip) {
    Write-Host "Success! Created compliant ZIP: $outputZip" -ForegroundColor Green
    Write-Host "Ready to test or upload to https://addons.mozilla.org/developers/" -ForegroundColor Yellow
} else {
    Write-Error "Failed to generate $outputZip"
}
