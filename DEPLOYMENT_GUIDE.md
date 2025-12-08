# PeerUP Deployment Guide

## 🚀 Deploying to Vercel (Recommended)

Vercel is the easiest platform for Next.js applications. Follow these steps:

### Step 1: Prepare Your Repository

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Resolve merge conflicts and prepare for deployment"
   git push origin main
   ```

2. **Ensure your code is on GitHub/GitLab/Bitbucket**

### Step 2: Deploy to Vercel

1. **Go to [Vercel](https://vercel.com)**
   - Sign up or log in with your GitHub account
   - Click "Add New Project"

2. **Import Your Repository**
   - Select your PeerUP repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   - Click "Environment Variables" in project settings
   - Add all variables from your `.env.local`:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     NEXTAUTH_SECRET=your_nextauth_secret
     NEXTAUTH_URL=https://your-app.vercel.app
     VERTEX_AI_API_KEY=your_gemini_api_key
     ```

4. **Build Settings** (usually auto-detected):
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (or `npm run build`)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (or `npm ci`)

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Step 3: Post-Deployment

1. **Update Firebase Authorized Domains**
   - Go to Firebase Console → Authentication → Settings
   - Add your Vercel domain to authorized domains

2. **Update NEXTAUTH_URL**
   - In Vercel project settings, update `NEXTAUTH_URL` to your actual Vercel URL

---

## 🌐 Deploying to Netlify

### Step 1: Prepare Your Repository

1. **Remove hardcoded secrets** (Already done in `lib/firebase.js`)
   - ✅ Hardcoded Firebase keys have been removed
   - ✅ Environment variables are now required

2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Remove hardcoded Firebase keys for Netlify deployment"
   git push origin main
   ```

### Step 2: Deploy to Netlify

1. **Go to [Netlify](https://netlify.com)**
   - Sign up or log in with GitHub
   - Click "Add new site" → "Import an existing project"

2. **Connect Repository**
   - Select your PeerUP repository
   - Netlify will auto-detect Next.js

3. **Build Settings** (The `netlify.toml` file is already configured)
   - **Build command:** `npm run build` (auto-detected from `netlify.toml`)
   - **Publish directory:** `.next` (auto-detected from `netlify.toml`)
   - **Base directory:** (leave empty if root)

4. **Environment Variables** (CRITICAL - Do this BEFORE deploying)
   - Click "Show advanced" → "New variable"
   - Add ALL these variables (one by one):
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     NEXTAUTH_SECRET=your_nextauth_secret
     NEXTAUTH_URL=https://your-app.netlify.app (update after first deploy)
     GOOGLE_GEMINI_API_KEY=your_gemini_api_key
     ```
   - **Important:** Set these BEFORE clicking "Deploy site"

5. **Configure Secrets Scanning** (To prevent false positives)
   - Go to Site settings → Build & deploy → Environment
   - Scroll to "Secrets scanning"
   - Add to "Omit paths": `.next/**`
   - Or add environment variable: `SECRETS_SCAN_OMIT_PATHS=.next/**`
   - This tells Netlify to ignore the build output (where Firebase keys are bundled)

6. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete (first build may take 2-3 minutes)

### Step 3: Fix Secrets Scanning Error (If it still occurs)

If you still see secrets scanning errors:

1. **Option A: Disable secrets scanning for build output**
   - Go to Site settings → Build & deploy → Environment
   - Add environment variable:
     - Key: `SECRETS_SCAN_OMIT_PATHS`
     - Value: `.next/**`
   - Redeploy

2. **Option B: Configure in netlify.toml** (Already done)
   - The `netlify.toml` file already includes this configuration
   - Make sure it's committed to your repository

3. **Option C: Disable secrets scanning entirely** (Not recommended)
   - Go to Site settings → Build & deploy → Environment
   - Add environment variable:
     - Key: `SECRETS_SCAN_ENABLED`
     - Value: `false`

### Step 4: Post-Deployment

1. **Update Firebase Authorized Domains**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Authentication → Settings → Authorized domains
   - Click "Add domain"
   - Add: `your-app.netlify.app` (replace with your actual Netlify domain)

2. **Update NEXTAUTH_URL**
   - Go to Netlify Site settings → Environment variables
   - Find `NEXTAUTH_URL`
   - Update value to: `https://your-app.netlify.app` (your actual URL)
   - Click "Save"
   - Trigger a new deploy (Deploys → Trigger deploy → Deploy site)

---

## 🔧 Common Issues & Solutions

### Issue 1: Build Fails with "Module not found"
**Solution:** Ensure all dependencies are in `package.json`:
```bash
npm install
npm run build
```

### Issue 2: Environment Variables Not Working
**Solution:** 
- Ensure all `NEXT_PUBLIC_*` variables are set in deployment platform
- Restart the build after adding variables
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser

### Issue 3: Firebase Connection Errors
**Solution:**
- Verify Firebase project ID matches in environment variables
- Check Firebase project is active
- Ensure Firestore rules are deployed

### Issue 4: API Routes Not Working
**Solution:**
- Ensure API routes are in `app/api/` directory
- Check server-side environment variables are set
- Verify API routes don't use client-only code

### Issue 5: WebRTC/Calling Not Working
**Solution:**
- WebRTC requires HTTPS (automatically provided by Vercel/Netlify)
- Ensure STUN servers are accessible
- Check browser console for WebRTC errors

### Issue 6: Netlify Secrets Scanning Error
**Error:** "Secrets scanning detected secrets in files during build"
**Solution:**
1. **Ensure hardcoded keys are removed** (already fixed in `lib/firebase.js`)
2. **Set environment variables in Netlify** BEFORE deploying
3. **Configure secrets scanning to ignore build output:**
   - Add environment variable: `SECRETS_SCAN_OMIT_PATHS=.next/**`
   - Or use the `netlify.toml` configuration (already included)
4. **Redeploy** after making changes
5. **Note:** Firebase `NEXT_PUBLIC_*` keys are intentionally public (client-side), but Netlify's scanner flags them. The configuration above tells Netlify to ignore the bundled output.

---

## 📋 Pre-Deployment Checklist

- [ ] All merge conflicts resolved
- [ ] Code builds successfully (`npm run build`)
- [ ] Environment variables documented
- [ ] Firebase project configured
- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] API keys secured (not in code)
- [ ] Test authentication flow
- [ ] Test matching functionality
- [ ] Test chat functionality
- [ ] Test calling functionality (if applicable)

---

## 🔐 Security Checklist

- [ ] No API keys in code (use environment variables)
- [ ] Firestore security rules are restrictive
- [ ] Authentication required for sensitive operations
- [ ] CORS configured correctly
- [ ] HTTPS enabled (automatic on Vercel/Netlify)

---

## 🚀 Quick Deploy Commands

### Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

### Netlify CLI
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 📞 Need Help?

- **Vercel Docs:** https://nextjs.org/docs/deployment
- **Netlify Docs:** https://docs.netlify.com/integrations/frameworks/nextjs/
- **Firebase Setup:** See `SETUP_GUIDE.md`

---

## 🎉 After Deployment

1. Test all features:
   - Sign up/Sign in
   - Profile creation
   - Matching
   - Chatting
   - Calling (if implemented)
   - Goals & Tasks

2. Monitor:
   - Vercel/Netlify dashboard for errors
   - Firebase Console for usage
   - Browser console for client errors

3. Set up custom domain (optional):
   - Vercel: Project Settings → Domains
   - Netlify: Site Settings → Domain Management

Your PeerUP app is now live! 🌟

