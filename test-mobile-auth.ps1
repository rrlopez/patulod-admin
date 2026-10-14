# Test script for mobile auth endpoints
$baseUrl = "http://localhost:3000"

Write-Host "Testing Mobile Authentication Endpoints" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Register a new passenger
Write-Host "1. Testing Registration..." -ForegroundColor Yellow

# Generate unique email for testing
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "juan.passenger.$timestamp@test.com"
$testPhone = "+639" + (Get-Random -Minimum 100000000 -Maximum 999999999)

$registerBody = @{
    fullName = "Juan Dela Cruz"
    email = $testEmail
    phone = $testPhone
    password = "TestPass123"
    confirmPassword = "TestPass123"
    termsVersion = "1.0"
    privacyVersion = "1.0"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    
    Write-Host "Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.user.id)" -ForegroundColor Gray
    Write-Host "Role: $($registerResponse.user.role)`n" -ForegroundColor Gray
    
    $sessionToken = $registerResponse.session.token
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Error details: $($errorResponse | ConvertTo-Json -Depth 3)`n" -ForegroundColor Red
    } else {
        Write-Host "Response: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
    }
    exit 1
}

# Test 2: Login with the registered user
Write-Host "2. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "TestPass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Phone: $($loginResponse.user.phone)`n" -ForegroundColor Gray
    
    $sessionToken = $loginResponse.session.token
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# Test 3: Get current user profile
Write-Host "3. Testing Get Profile..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $sessionToken"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/me" -Method Get -Headers $headers
    
    Write-Host "Profile retrieved!" -ForegroundColor Green
    Write-Host "Full Name: $($profileResponse.user.fullName)" -ForegroundColor Gray
    Write-Host "Email: $($profileResponse.user.email)" -ForegroundColor Gray
    Write-Host "Role: $($profileResponse.user.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

# Test 4: Logout
Write-Host "4. Testing Logout..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $sessionToken"
    }
    
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/mobile/auth/logout" -Method Post -Headers $headers
    
    Write-Host "Logout successful!" -ForegroundColor Green
    Write-Host "Message: $($logoutResponse.message)`n" -ForegroundColor Gray
} catch {
    Write-Host "Logout failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All tests completed!" -ForegroundColor Cyan
