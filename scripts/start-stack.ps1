<#
Start the full docker-compose stack and tail important logs.
Usage: run from repo root: .\scripts\start-stack.ps1
#>
Set-StrictMode -Version Latest

Write-Output "Building and starting stack..."
docker-compose up --build -d

Write-Output "Waiting 8 seconds for services to initialize..."
Start-Sleep -Seconds 8

Write-Output "API health:"
try {
    $r = Invoke-RestMethod http://localhost:8080/health -ErrorAction Stop
    Write-Output $r
} catch {
    Write-Warning "API health check failed. Check docker-compose ps and logs."
}

Write-Output "Parser health:"
try {
    $r = Invoke-RestMethod http://localhost:8081/health -ErrorAction Stop
    Write-Output $r
} catch {
    Write-Warning "Parser health check failed. Check docker-compose ps and logs."
}

Write-Output "Tailing parser logs (ctrl+c to stop)..."
docker-compose logs -f parser
