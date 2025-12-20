@echo off
echo ========================================
echo Firestore Database Setup
echo ========================================
echo.

echo Step 1: Checking Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Firebase CLI is not installed.
    echo Please install it first: npm install -g firebase-tools
    pause
    exit /b 1
)

echo Firebase CLI found!
echo.

echo Step 2: Logging into Firebase...
echo This will open your browser for authentication.
firebase login
if errorlevel 1 (
    echo ERROR: Failed to login to Firebase.
    pause
    exit /b 1
)

echo.
echo Step 3: Setting Firebase project...
firebase use peerup-64fbf
if errorlevel 1 (
    echo ERROR: Failed to set Firebase project.
    pause
    exit /b 1
)

echo.
echo Step 4: Deploying Firestore Security Rules...
firebase deploy --only firestore:rules
if errorlevel 1 (
    echo ERROR: Failed to deploy Firestore rules.
    pause
    exit /b 1
)

echo.
echo Step 5: Deploying Firestore Indexes...
firebase deploy --only firestore:indexes
if errorlevel 1 (
    echo ERROR: Failed to deploy Firestore indexes.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Wait a few minutes for indexes to build
echo 2. Start your app: npm run dev
echo 3. Create a test user account
echo 4. Verify collections in Firebase Console
echo.
echo To verify database structure, visit:
echo http://localhost:3000/dashboard/admin/verify-database
echo.
pause

