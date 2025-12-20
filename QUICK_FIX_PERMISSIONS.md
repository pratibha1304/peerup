# 🔧 Quick Fix: Permission Denied Error

## Problem
You're seeing this error:
```
Error fetching user data: FirebaseError: Missing or insufficient permissions.
```

## Root Cause
Your Firestore security rules haven't been deployed to Firebase yet. The rules file exists locally but Firebase doesn't know about them.

## Solution (Choose One)

### Option 1: Run the Setup Script (Easiest)
Double-click `setup-database.bat` in your project root folder.

This will:
1. Log you into Firebase (opens browser)
2. Deploy Firestore rules
3. Deploy Firestore indexes

### Option 2: Manual Deployment

1. **Login to Firebase:**
   ```bash
   firebase login
   ```
   (This will open your browser for authentication)

2. **Deploy Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Firestore Indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Option 3: Use Firebase Console (If CLI doesn't work)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **peerup-64fbf**
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

## Verify It's Fixed

After deploying rules:
1. Refresh your app
2. Try signing up again
3. The permission error should be gone

## Still Having Issues?

If you still get errors after deploying rules:
1. Check Firebase Console → Firestore → Rules to confirm they're published
2. Make sure you're logged into the correct Firebase project
3. Verify your `.firebaserc` file has: `"default": "peerup-64fbf"`


