# Stop all containers and remove them
docker-compose down

# Loop through each service and build it
$services = Get-ChildItem -Path "services" -Directory
foreach ($service in $services) {
    if (Test-Path "$($service.FullName)\pom.xml") {
        Write-Host "Building $($service.Name)..." -ForegroundColor Cyan
        Set-Location $service.FullName
        ..\..\mvnw.cmd clean package -DskipTests
        Set-Location ..\..
    }
}

# Build gateway
Write-Host "Building gateway..." -ForegroundColor Cyan
if (Test-Path "gateway\pom.xml") {
    Set-Location gateway
    ..\mvnw.cmd clean package -DskipTests
    Set-Location ..
}

# Rebuild and start Docker containers
Write-Host "Restarting Docker Compose..." -ForegroundColor Green
docker-compose up -d --build --remove-orphans

Write-Host "Done! Please wait a minute for services to start and register with Eureka." -ForegroundColor Green
