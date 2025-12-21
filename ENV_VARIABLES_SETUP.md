# Environment Variables Setup Guide

This guide explains how to set up the Google Calendar OAuth environment variables for both local development and production (Netlify).

## Required Environment Variables

For Google Calendar integration, you need:
- `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth Client Secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Same as GOOGLE_CLIENT_ID (for client-side use)

## Step 1: Get Your Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID (or create one if you don't have it)
5. Copy the **Client ID** and **Client Secret**

**Note:** If you don't have credentials yet, follow the [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) guide first.

## Step 2: Set Up Local Development (.env.local)

1. **Create or edit `.env.local` file** in the root of your project:
   ```bash
   # If file doesn't exist, create it
   touch .env.local
   ```

2. **Add the following variables** to `.env.local`:
   ```env
   # Google Calendar OAuth (Server-side only)
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here

   # Google Calendar OAuth (Client-side - must start with NEXT_PUBLIC_)
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com

   # Your app URL (for OAuth redirect)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Replace the placeholder values** with your actual credentials:
   - Replace `your-client-id-here.apps.googleusercontent.com` with your actual Client ID
   - Replace `your-client-secret-here` with your actual Client Secret

4. **Save the file**

5. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

**Important Notes:**
- `.env.local` is already in `.gitignore`, so it won't be committed to Git
- Never commit your Client Secret to version control
- The `NEXT_PUBLIC_` prefix makes variables available to client-side code
- Variables without `NEXT_PUBLIC_` are server-side only (more secure)

## Step 3: Set Up Production (Netlify)

### Option A: Using Netlify Dashboard (Recommended)

1. **Go to your Netlify site dashboard**
   - Visit [app.netlify.com](https://app.netlify.com)
   - Select your site

2. **Navigate to Site Settings**:
   - Click **Site configuration** > **Environment variables**
   - Or go directly: `https://app.netlify.com/sites/YOUR_SITE_NAME/configuration/env`

3. **Add each environment variable**:
   - Click **Add variable** button
   - Enter variable name: `GOOGLE_CLIENT_ID`
   - Enter variable value: Your Client ID (format: `xxxxx-xxxxx.apps.googleusercontent.com`)
   - Click **Create variable**

4. **Repeat for other variables**:
   - `GOOGLE_CLIENT_SECRET` = Your Client Secret (format: `GOCSPX-xxxxx`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Same as GOOGLE_CLIENT_ID
   - `NEXT_PUBLIC_APP_URL` = Your production URL (e.g., `https://your-site.netlify.app`)

5. **Redeploy your site**:
   - Go to **Deploys** tab
   - Click **Trigger deploy** > **Deploy site**
   - Or push a new commit to trigger automatic deployment

### Option B: Using Netlify CLI

1. **Install Netlify CLI** (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Set environment variables**:
   ```bash
   # Set GOOGLE_CLIENT_ID
   netlify env:set GOOGLE_CLIENT_ID "your-client-id-here.apps.googleusercontent.com"

   # Set GOOGLE_CLIENT_SECRET
   netlify env:set GOOGLE_CLIENT_SECRET "your-client-secret-here"

   # Set NEXT_PUBLIC_GOOGLE_CLIENT_ID
   netlify env:set NEXT_PUBLIC_GOOGLE_CLIENT_ID "your-client-id-here.apps.googleusercontent.com"

   # Set NEXT_PUBLIC_APP_URL
   netlify env:set NEXT_PUBLIC_APP_URL "https://your-site.netlify.app"
   ```

4. **Redeploy**:
   ```bash
   netlify deploy --prod
   ```

## Step 4: Verify Setup

### Local Development

1. **Check if variables are loaded**:
   ```bash
   # In your terminal, start the dev server
   npm run dev
   ```

2. **Test the calendar connection**:
   - Go to `http://localhost:3000/dashboard/settings`
   - Click "Connect Google Calendar"
   - You should be redirected to Google OAuth
   - After authorization, you should be redirected back

3. **Check for errors**:
   - Open browser console (F12)
   - Look for any errors related to Google OAuth
   - Check server logs for environment variable issues

### Production (Netlify)

1. **Check environment variables in Netlify**:
   - Go to Site Settings > Environment variables
   - Verify all variables are set correctly

2. **Check build logs**:
   - Go to Deploys tab
   - Click on the latest deploy
   - Check for any errors about missing environment variables

3. **Test the calendar connection**:
   - Visit `https://your-site.netlify.app/dashboard/settings`
   - Try connecting Google Calendar
   - Check browser console for errors

## Troubleshooting

### "Google Calendar integration is not configured"

**Error Message:**
```
Google Calendar integration is not configured. Please contact support.
```

**Solution:**
1. Verify environment variables are set:
   - Check `.env.local` for local development
   - Check Netlify environment variables for production
2. Ensure variable names are exact (case-sensitive):
   - `GOOGLE_CLIENT_ID` (not `GOOGLE_CLIENT_ID_` or `google_client_id`)
   - `GOOGLE_CLIENT_SECRET` (not `GOOGLE_CLIENT_SECRET_`)
3. Restart your development server after changing `.env.local`
4. Redeploy on Netlify after adding environment variables

### "Missing required fields" error

**Solution:**
- Ensure all three variables are set:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### Variables not loading in production

**Solution:**
1. Check Netlify environment variables are set
2. Ensure you've redeployed after adding variables
3. Check that variable names don't have extra spaces
4. Verify the site is using the correct environment (production vs. branch)

### OAuth redirect errors

**Solution:**
1. Ensure `NEXT_PUBLIC_APP_URL` matches your actual site URL
2. Verify redirect URIs in Google Cloud Console:
   - Local: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-site.netlify.app/api/auth/google/callback`

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Never expose Client Secret** in client-side code
3. **Use different credentials** for development and production (optional but recommended)
4. **Rotate secrets** if they're accidentally exposed
5. **Use environment-specific URLs** for `NEXT_PUBLIC_APP_URL`

## Quick Reference

### Local Development (.env.local)
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Netlify)
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
```

## Need Help?

If you're still having issues:
1. Check the [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md) guide
2. Verify your Google Cloud Console OAuth settings
3. Check Netlify build logs for specific errors
4. Ensure your Google OAuth consent screen is configured

