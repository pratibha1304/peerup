# Firestore Database Setup Script (PowerShell)
# This script helps you set up your Firestore database after deletion

Write-Host "🔥 Firestore Database Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version 2>$null
} catch {
    Write-Host "❌ Firebase CLI is not installed." -ForegroundColor Red
    Write-Host "   Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    $null = firebase projects:list 2>$null
} catch {
    Write-Host "⚠️  You are not logged into Firebase." -ForegroundColor Yellow
    Write-Host "   Logging in..." -ForegroundColor Yellow
    firebase login
}

Write-Host "📋 Step 1: Deploying Firestore Security Rules..." -ForegroundColor Cyan
firebase deploy --only firestore:rules

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore rules deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy Firestore rules" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Step 2: Deploying Firestore Indexes..." -ForegroundColor Cyan
firebase deploy --only firestore:indexes

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Firestore indexes deployed successfully!" -ForegroundColor Green
    Write-Host "   Note: Indexes may take a few minutes to build." -ForegroundColor Yellow
} else {
    Write-Host "❌ Failed to deploy Firestore indexes" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Wait a few minutes for indexes to build"
Write-Host "   2. Start your app: npm run dev"
Write-Host "   3. Create a test user account"
Write-Host "   4. Verify collections in Firebase Console"
Write-Host ""
Write-Host "🔍 To verify database structure, visit:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000/dashboard/admin/verify-database"
Write-Host ""

