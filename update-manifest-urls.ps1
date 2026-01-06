# PowerShell script to update manifest.xml with new domain
# Updates all URLs from Render/Cloud Run to agoracalendar.org

$manifestPath = "outlook-addin\manifest.xml"
$newDomain = "https://agoracalendar.org"

Write-Host "🔄 Updating manifest.xml URLs..." -ForegroundColor Cyan
Write-Host ""

# Check if manifest exists
if (-not (Test-Path $manifestPath)) {
    Write-Host "❌ Error: $manifestPath not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Read the manifest file
$content = Get-Content $manifestPath -Raw

# Count occurrences before replacement
$oldUrl1 = "https://agora9-react-render.onrender.com"
$oldUrl2 = "https://agora-react-465255599078.us-central1.run.app"
$count1 = ([regex]::Matches($content, [regex]::Escape($oldUrl1))).Count
$count2 = ([regex]::Matches($content, [regex]::Escape($oldUrl2))).Count
$totalCount = $count1 + $count2

Write-Host "Found $count1 occurrences of: $oldUrl1" -ForegroundColor Yellow
Write-Host "Found $count2 occurrences of: $oldUrl2" -ForegroundColor Yellow
Write-Host "Total URLs to replace: $totalCount" -ForegroundColor Yellow
Write-Host ""

if ($totalCount -eq 0) {
    Write-Host "⚠ No URLs found to replace. Manifest may already be updated." -ForegroundColor Yellow
    exit 0
}

# Create backup
$backupPath = "$manifestPath.backup"
Copy-Item $manifestPath $backupPath
Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green

# Replace all occurrences
$content = $content -replace [regex]::Escape($oldUrl1), $newDomain
$content = $content -replace [regex]::Escape($oldUrl2), $newDomain

# Write updated content
Set-Content -Path $manifestPath -Value $content -NoNewline

Write-Host ""
Write-Host "✅ Successfully updated manifest.xml!" -ForegroundColor Green
Write-Host "   All URLs now point to: $newDomain" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review the changes: Get-Content $manifestPath" -ForegroundColor Yellow
Write-Host "   2. Rebuild Docker image with updated manifest" -ForegroundColor Yellow
Write-Host "   3. Push and redeploy to Cloud Run" -ForegroundColor Yellow
Write-Host ""
Write-Host "💾 Backup saved at: $backupPath" -ForegroundColor Gray
