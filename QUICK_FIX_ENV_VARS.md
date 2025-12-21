# Quick Fix: Environment Variables Not Working

## The Problem

You've set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` but it's still showing as "not set".

## Why This Happens

**`.env.local` only works for LOCAL development!**

- ✅ `.env.local` → Works on `localhost:3000` (local dev server)
- ❌ `.env.local` → Does NOT work on Netlify (production)

## Solution

### If Testing Locally (localhost:3000)

1. **Verify `.env.local` file exists** in the project root (same folder as `package.json`)

2. **Check file contents** - it should look like:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

4. **Verify it's loaded**:
   - Open browser console (F12)
   - Type: `console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)`
   - Should show your Client ID (not `undefined`)

### If Testing on Production (Netlify)

**`.env.local` does NOT work on Netlify!** You must set environment variables in Netlify:

1. **Go to Netlify Dashboard**:
   - Visit [app.netlify.com](https://app.netlify.com)
   - Select your site

2. **Add Environment Variables**:
   - Go to **Site configuration** → **Environment variables**
   - Click **Add variable**
   - Add these variables:
     ```
     NEXT_PUBLIC_GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_ID = your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET = your-client-secret
     NEXT_PUBLIC_APP_URL = https://your-site.netlify.app
     ```

3. **Redeploy** (IMPORTANT!):
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - Wait for build to complete

4. **Test again**:
   - Visit your production site
   - Go to Settings
   - Try connecting calendar

## How to Tell Where You're Running

- **Local**: URL starts with `http://localhost:3000`
- **Production**: URL starts with `https://your-site.netlify.app`

## Common Mistakes

### Mistake 1: Testing Production but Only Set `.env.local`
- **Fix**: Set variables in Netlify and redeploy

### Mistake 2: Forgot to Restart Dev Server
- **Fix**: Stop and restart `npm run dev` after changing `.env.local`

### Mistake 3: Wrong File Location
- **Fix**: `.env.local` must be in project root (same folder as `package.json`)

### Mistake 4: Typo in Variable Name
- **Fix**: Must be exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (case-sensitive)

### Mistake 5: Added Variable But Didn't Redeploy
- **Fix**: Netlify requires redeploy after adding environment variables

## Quick Checklist

**For Local Development:**
- [ ] `.env.local` file exists in project root
- [ ] File contains `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`
- [ ] Dev server restarted after creating/editing `.env.local`
- [ ] Testing on `localhost:3000`

**For Production (Netlify):**
- [ ] Variables added in Netlify Dashboard
- [ ] Variable names are exact (case-sensitive)
- [ ] Site redeployed after adding variables
- [ ] Testing on production URL (not localhost)

## Still Not Working?

1. **Check browser console** (F12) for the detailed error message
2. **Verify file location**: `.env.local` should be next to `package.json`
3. **Check for typos**: Variable names must match exactly
4. **Restart everything**: Stop dev server, clear cache, restart
5. **For Netlify**: Check build logs for environment variable warnings

