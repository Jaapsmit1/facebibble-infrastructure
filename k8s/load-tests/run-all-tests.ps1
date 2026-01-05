#!/usr/bin/env pwsh
# Run all load tests sequentially with monitoring

Write-Host "=== Kubernetes Autoscaling Load Test Suite ===" -ForegroundColor Cyan
Write-Host ""

# Check if k6 is installed
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: k6 is not installed!" -ForegroundColor Red
    Write-Host "Install with: choco install k6" -ForegroundColor Yellow
    exit 1
}

# Check if cluster is running
Write-Host "Checking Minikube cluster..." -ForegroundColor Yellow
$clusterStatus = minikube status --format='{{.Host}}' 2>$null
if ($clusterStatus -ne "Running") {
    Write-Host "ERROR: Minikube cluster is not running!" -ForegroundColor Red
    Write-Host "Start with: minikube start" -ForegroundColor Yellow
    exit 1
}

# Get Minikube IP
$minikubeIP = minikube ip
Write-Host "Minikube IP: $minikubeIP" -ForegroundColor Green
Write-Host "API Gateway: http://${minikubeIP}:30080" -ForegroundColor Green
Write-Host ""

# Show initial pod status
Write-Host "=== Initial Pod Status ===" -ForegroundColor Cyan
kubectl get pods -n facebibble
kubectl get hpa -n facebibble
Write-Host ""

# Function to run a test with monitoring
function Run-LoadTest {
    param (
        [string]$TestFile,
        [string]$ServiceName,
        [int]$WaitMinutes = 6
    )
    
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Testing: $ServiceName" -ForegroundColor Green
    Write-Host "File: $TestFile" -ForegroundColor Gray
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "Starting load test..." -ForegroundColor Yellow
    Write-Host "TIP: Open another terminal and run: kubectl get hpa -n facebibble -w" -ForegroundColor Yellow
    Write-Host ""
    
    # Run the load test
    k6 run $TestFile
    
    Write-Host ""
    Write-Host "Load test completed! Waiting $WaitMinutes minutes for autoscaling to stabilize..." -ForegroundColor Yellow
    Write-Host ""
    
    # Monitor for scale-down
    Write-Host "=== Monitoring HPA (Ctrl+C to skip) ===" -ForegroundColor Cyan
    kubectl get hpa -n facebibble
    Write-Host ""
    
    Write-Host "Waiting ${WaitMinutes} minutes for scale-down..." -ForegroundColor Yellow
    Start-Sleep -Seconds ($WaitMinutes * 60)
    
    Write-Host ""
    Write-Host "=== Final Status for $ServiceName ===" -ForegroundColor Green
    kubectl get pods -n facebibble | Select-String -Pattern $ServiceName
    kubectl get hpa -n facebibble | Select-String -Pattern $ServiceName
    Write-Host ""
}

# Ask user which tests to run
Write-Host "Which tests would you like to run?" -ForegroundColor Cyan
Write-Host "1) Post Service" -ForegroundColor White
Write-Host "2) Comment Service" -ForegroundColor White
Write-Host "3) Registration Service" -ForegroundColor White
Write-Host "4) User Management Service" -ForegroundColor White
Write-Host "5) API Gateway" -ForegroundColor White
Write-Host "6) All tests (sequential)" -ForegroundColor White
Write-Host "7) Quick test (Post Service only, 2min wait)" -ForegroundColor Yellow
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

switch ($choice) {
    "1" {
        Run-LoadTest -TestFile "post-service-load.js" -ServiceName "post-service"
    }
    "2" {
        Write-Host "NOTE: Make sure to update TEST_POST_ID in comment-service-load.js!" -ForegroundColor Yellow
        $continue = Read-Host "Press Enter to continue or Ctrl+C to cancel"
        Run-LoadTest -TestFile "comment-service-load.js" -ServiceName "comment-service"
    }
    "3" {
        Run-LoadTest -TestFile "registration-service-load.js" -ServiceName "registration-service"
    }
    "4" {
        Run-LoadTest -TestFile "user-management-load.js" -ServiceName "user-management-service"
    }
    "5" {
        Run-LoadTest -TestFile "api-gateway-load.js" -ServiceName "api-gateway"
    }
    "6" {
        Write-Host "Running ALL tests sequentially. This will take ~30+ minutes!" -ForegroundColor Yellow
        $continue = Read-Host "Press Enter to continue or Ctrl+C to cancel"
        
        Run-LoadTest -TestFile "post-service-load.js" -ServiceName "post-service"
        Run-LoadTest -TestFile "registration-service-load.js" -ServiceName "registration-service"
        Run-LoadTest -TestFile "user-management-load.js" -ServiceName "user-management-service"
        Run-LoadTest -TestFile "api-gateway-load.js" -ServiceName "api-gateway"
        
        Write-Host ""
        Write-Host "=== ALL TESTS COMPLETE ===" -ForegroundColor Green
        kubectl get pods -n facebibble
        kubectl get hpa -n facebibble
    }
    "7" {
        Write-Host "Running quick test (2-minute wait for scale-down)..." -ForegroundColor Yellow
        Run-LoadTest -TestFile "post-service-load.js" -ServiceName "post-service" -WaitMinutes 2
    }
    default {
        Write-Host "Invalid choice!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=== Load Testing Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "View results in Kubernetes Dashboard:" -ForegroundColor Cyan
Write-Host "  minikube dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Check current status:" -ForegroundColor Cyan
Write-Host "  kubectl get pods -n facebibble" -ForegroundColor White
Write-Host "  kubectl get hpa -n facebibble" -ForegroundColor White
Write-Host ""
