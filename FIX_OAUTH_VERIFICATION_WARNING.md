# Fix: "Google hasn't verified this app" Warning

## The Problem

When users try to connect their Google Calendar, they see a warning:
- "Google hasn't verified this app"
- "The app is requesting access to sensitive info in your Google Account"
- A "BACK TO SAFETY" button

## Why This Happens

This happens because your OAuth consent screen is in **Testing** mode. Google shows this warning to protect users from unverified apps.

## Solution Options

### Option 1: Add Test Users (Quick Fix for Testing)

If you're still testing the app, add test users:

1. **Go to Google Cloud Console**:
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project

2. **Navigate to OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**

3. **Add Test Users**:
   - Scroll down to **Test users** section
   - Click **+ ADD USERS**
   - Enter the email addresses of users who should be able to connect
   - Click **ADD**

4. **Save Changes**

**Note:** Only the email addresses you add will be able to connect their calendars. They'll still see the warning but can proceed.

### Option 2: Proceed Anyway (For Testing)

Users can still proceed even with the warning:

1. Click **"Advanced"** (bottom left of the warning page)
2. Click **"Go to [Your App Name] (unsafe)"**
3. They'll be able to authorize the app

**Note:** This is fine for testing, but not ideal for production.

### Option 3: Publish Your App (For Production)

To remove the warning completely, you need to verify your app with Google:

1. **Go to OAuth Consent Screen**:
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Select your project
   - Go to **APIs & Services** → **OAuth consent screen**

2. **Complete Required Fields**:
   - App name: "PeerUp" (or your app name)
   - User support email: Your email
   - App logo (optional but recommended)
   - App domain (your Netlify domain)
   - Developer contact information: Your email

3. **Add Scopes**:
   - Make sure these scopes are added:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`

4. **Submit for Verification**:
   - Click **PUBLISH APP** button
   - Google will review your app (can take a few days to weeks)
   - Once approved, the warning will disappear

**Important Notes:**
- Verification can take **1-7 days** or longer
- Google may ask for additional information
- For sensitive scopes (like Calendar), verification is required
- You can still use the app in testing mode while waiting for verification

## Quick Fix for Now (Recommended)

**For immediate testing, use Option 1** (Add Test Users):

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Scroll to **Test users**
4. Click **+ ADD USERS**
5. Add your email and any test user emails
6. Save

Now those users can:
- See the warning (it's normal)
- Click **"Advanced"** → **"Go to PeerUp (unsafe)"**
- Successfully connect their calendars

## What Users Should Do

When users see the warning:

1. **Click "Advanced"** (bottom left)
2. **Click "Go to PeerUp (unsafe)"** (or your app name)
3. **Review permissions** and click **"Allow"**
4. They'll be redirected back to your app

**Note:** The warning is safe to bypass for testing. Google shows it because the app isn't verified yet.

## For Production

Once you're ready for production:

1. Complete the OAuth consent screen with all required information
2. Submit for Google verification
3. Wait for approval
4. The warning will disappear for all users

## Troubleshooting

### "This app is blocked"

**Solution:** 
- Make sure the user's email is in the Test users list
- Or publish the app (requires verification)

### "Access blocked: This app's request is invalid"

**Solution:**
- Check OAuth consent screen is configured
- Verify scopes are added
- Ensure redirect URIs are correct

### Users can't proceed even after clicking Advanced

**Solution:**
- Add them as test users in Google Cloud Console
- Or verify the app with Google

## Summary

**For Testing (Now):**
- Add test users in Google Cloud Console
- Users click "Advanced" → "Go to PeerUp (unsafe)"
- Works immediately

**For Production (Later):**
- Complete OAuth consent screen
- Submit for Google verification
- Wait for approval (1-7 days)
- Warning disappears automatically

