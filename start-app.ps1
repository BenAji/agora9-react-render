# Load PORT from .env.local if it exists, otherwise default to 3000
if (Test-Path .env.local) {
    $envContent = Get-Content .env.local
    $portLine = $envContent | Where-Object { $_ -match '^PORT=(\d+)$' }
    if ($portLine) {
        $env:PORT = ($portLine -split '=')[1].Trim()
    }
}

# If PORT still not set, use default 3000
if (-not $env:PORT) {
    $env:PORT = 3000
}

Write-Host "Starting React app on port $env:PORT"
npm start
