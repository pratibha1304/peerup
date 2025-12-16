#!/bin/bash

# Firestore Database Setup Script
# This script helps you set up your Firestore database after deletion

echo "🔥 Firestore Database Setup"
echo "=========================="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  You are not logged into Firebase."
    echo "   Logging in..."
    firebase login
fi

echo "📋 Step 1: Deploying Firestore Security Rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

echo ""
echo "📋 Step 2: Deploying Firestore Indexes..."
firebase deploy --only firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firestore indexes deployed successfully!"
    echo "   Note: Indexes may take a few minutes to build."
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Wait a few minutes for indexes to build"
echo "   2. Start your app: npm run dev"
echo "   3. Create a test user account"
echo "   4. Verify collections in Firebase Console"
echo ""
echo "🔍 To verify database structure, visit:"
echo "   http://localhost:3000/dashboard/admin/verify-database"
echo ""

