param()

$fontDir = "lib/fontawesome/webfonts"
$cdnUrl = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts"

if (-not (Test-Path $fontDir)) {
    New-Item -ItemType Directory -Path $fontDir -Force
}

$fonts = @("fa-solid-900.woff2", "fa-solid-900.woff", "fa-solid-900.ttf")

Write-Host "Downloading Font Awesome webfonts..."

foreach ($font in $fonts) {
    $url = "$cdnUrl/$font"
    $outputPath = Join-Path $fontDir $font
    
    if (Test-Path $outputPath) {
        Write-Host "Skipping $font (already exists)"
    } else {
        Write-Host "Downloading $font..."
        Invoke-WebRequest -Uri $url -OutFile $outputPath
        Write-Host "Downloaded $font"
    }
}

Write-Host "Download complete!"
