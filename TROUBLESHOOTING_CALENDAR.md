# Troubleshooting: Google Calendar Connection Issues

## Error: "Google Calendar integration is not configured"

This error means `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not available in the client-side code.

### Why This Happens

In Next.js, environment variables prefixed with `NEXT_PUBLIC_` are embedded into the JavaScript bundle **at build time**. This means:

1. ✅ Variables must be set **before** building
2. ✅ You must **redeploy** after adding/updating variables
3. ❌ Variables added after build won't be available

### Solution: Verify and Redeploy

#### Step 1: Check Netlify Environment Variables

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site configuration** → **Environment variables**
4. Verify these variables are set:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = Your Client ID
   - `GOOGLE_CLIENT_ID` = Same as above (for server-side)
   - `GOOGLE_CLIENT_SECRET` = Your Client Secret
   - `NEXT_PUBLIC_APP_URL` = Your site URL (e.g., `https://peerup152.netlify.app`)

#### Step 2: Verify Variable Names

**Common mistakes:**
- ❌ `GOOGLE_CLIENT_ID` (missing `NEXT_PUBLIC_` prefix)
- ❌ `NEXT_PUBLIC_GOOGLE_CLIENT_ID_` (extra underscore)
- ❌ `next_public_google_client_id` (wrong case)
- ✅ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (correct)

**Important:** Variable names are **case-sensitive**!

#### Step 3: Redeploy Your Site

After adding/updating environment variables, you **must redeploy**:

**Option A: Trigger New Deploy**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for build to complete

**Option B: Push a Commit**
```bash
# Make a small change (like adding a comment)
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

#### Step 4: Verify Variables Are Available

After redeploy, check the browser console:

1. Open your site
2. Press F12 to open Developer Tools
3. Go to **Console** tab
4. Type: `console.log(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)`
5. You should see your Client ID (not `undefined`)

**Note:** In production, `process.env` is replaced with actual values at build time, so you'll see the value directly.

### Debugging Steps

#### 1. Check Build Logs

1. Go to Netlify → **Deploys** → Latest deploy
2. Check the build logs for:
   - Environment variable warnings
   - Build errors
   - Missing variable errors

#### 2. Check Browser Console

1. Open Settings page
2. Open Developer Tools (F12)
3. Go to **Console** tab
4. Click "Connect Google Calendar"
5. Look for error messages

#### 3. Verify OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Check your OAuth 2.0 Client ID:
   - Is it enabled?
   - Are redirect URIs correct?
   - Is the consent screen configured?

#### 4. Test Locally First

Before deploying to production, test locally:

1. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Test the connection locally

4. If it works locally but not in production, the issue is with Netlify environment variables

### Common Issues

#### Issue 1: Variable Not Set

**Symptom:** Alert shows "Google Calendar integration is not configured"

**Solution:**
- Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Netlify
- Redeploy the site

#### Issue 2: Variable Set But Not Available

**Symptom:** Variable is in Netlify but still shows error

**Possible causes:**
1. **Build happened before variable was added**
   - Solution: Redeploy after adding variable

2. **Variable name typo**
   - Solution: Double-check spelling (case-sensitive)

3. **Variable in wrong environment**
   - Solution: Check if variable is set for production (not just branch)

#### Issue 3: 400 Error on OAuth Redirect

**Symptom:** Redirects to Google but shows 400 error

**Possible causes:**
1. **Redirect URI mismatch**
   - Solution: Add exact redirect URI in Google Cloud Console:
     - `https://your-site.netlify.app/api/auth/google/callback`

2. **Client ID mismatch**
   - Solution: Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` matches the Client ID in Google Cloud Console

3. **OAuth consent screen not configured**
   - Solution: Complete OAuth consent screen setup in Google Cloud Console

#### Issue 4: Works Locally But Not in Production

**Symptom:** Connection works on localhost but fails on Netlify

**Solution:**
1. Verify Netlify environment variables match `.env.local`
2. Ensure `NEXT_PUBLIC_APP_URL` is set to production URL (not localhost)
3. Check redirect URIs in Google Cloud Console include production URL
4. Redeploy after making changes

### Quick Checklist

Before reporting issues, verify:

- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in Netlify
- [ ] `GOOGLE_CLIENT_ID` is set in Netlify (server-side)
- [ ] `GOOGLE_CLIENT_SECRET` is set in Netlify (server-side)
- [ ] `NEXT_PUBLIC_APP_URL` is set to production URL
- [ ] Site has been redeployed after adding variables
- [ ] Redirect URI is added in Google Cloud Console
- [ ] OAuth consent screen is configured
- [ ] Client ID matches in both places

### Still Not Working?

If you've checked everything above:

1. **Check Netlify build logs** for specific errors
2. **Check browser console** for JavaScript errors
3. **Verify Google Cloud Console** OAuth settings
4. **Test locally** to isolate the issue
5. **Contact support** with:
   - Screenshot of Netlify environment variables (hide secrets)
   - Browser console errors
   - Build log errors
   - Steps to reproduce

### Testing the Fix

After fixing, test:

1. Go to `/dashboard/settings`
2. Click "Connect Google Calendar"
3. Should redirect to Google (not show error)
4. After authorization, should redirect back to settings
5. Should show "Calendar Connected" status

