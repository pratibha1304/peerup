# Google Calendar API OAuth Setup Guide

This guide will help you set up Google Calendar API OAuth to automatically create calendar events with Google Meet links when video calls are scheduled.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your application deployed (or running locally)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "PeerUp Calendar Integration")
5. Click "Create"

## Step 2: Enable Google Calendar API

1. In your Google Cloud Project, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "PeerUp"
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes: `https://www.googleapis.com/auth/calendar` and `https://www.googleapis.com/auth/calendar.events`
   - Click **Save and Continue**
   - Add test users (your email) if in testing mode
   - Click **Save and Continue**
   - Review and click **Back to Dashboard**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "PeerUp Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://your-domain.com` (your production URL)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (for local)
     - `https://your-domain.com/api/auth/google/callback` (for production)
   - Click **Create**
   - **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these!

## Step 4: Add Environment Variables

Add these to your `.env.local` file (and Netlify environment variables):

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

# Your app URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Or for production:
# NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Important Notes:**
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are server-side only (used in API routes)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is client-side (used in the OAuth redirect URL)
- Never expose `GOOGLE_CLIENT_SECRET` in client-side code

## Step 5: Install Required Packages

The required package (`googleapis`) is already installed. If you need to install it manually:

```bash
npm install googleapis
```

**Note:** We're using the REST API directly instead of the `googleapis` library for simplicity, but the package is available if needed.

## Step 6: Implementation

The implementation is already complete and includes:
1. ✅ OAuth flow handler (`/api/auth/google/callback`)
2. ✅ Token storage utilities (`lib/google-calendar.ts`)
3. ✅ Calendar event creation API (`/api/calendar/create-event`)
4. ✅ Settings page for connecting/disconnecting calendar (`/dashboard/settings`)
5. ✅ Integration with schedule confirmation flow

## Step 7: Deploy Firestore Rules

You need to update Firestore security rules to allow users to store their calendar tokens:

1. The rules have already been updated in `firestore.rules`
2. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

Or use the setup script:
```bash
./setup-database.bat
```

## Step 7: User Authorization Flow

1. User clicks "Connect Google Calendar" in settings
2. Redirected to Google OAuth consent screen
3. User grants calendar permissions
4. Redirected back with authorization code
5. Exchange code for access/refresh tokens
6. Store tokens securely in Firestore
7. Use tokens to create calendar events

## Security Considerations

- **Never expose Client Secret** in client-side code
- Store refresh tokens securely (Firestore with proper security rules)
- Implement token refresh logic
- Use HTTPS in production
- Set proper OAuth consent screen scopes

## Testing

1. Test OAuth flow locally first
2. Verify calendar events are created
3. Check that Meet links are included
4. Test token refresh
5. Deploy to production and update redirect URIs

## Troubleshooting

### "Redirect URI mismatch"
- Ensure redirect URIs in Google Console match exactly (including http/https, trailing slashes)

### "Access blocked: This app's request is invalid"
- Check OAuth consent screen is configured
- Verify scopes are added
- Ensure app is in testing mode or published

### "Invalid credentials"
- Verify Client ID and Secret are correct
- Check environment variables are set
- Ensure credentials are for the correct project

## Next Steps

After setup, users will be able to:
1. Connect their Google Calendar
2. Automatically create calendar events when scheduling calls
3. Get Google Meet links automatically added
4. Receive calendar notifications

