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

Same as Vercel - ensure code is committed and pushed to GitHub.

### Step 2: Deploy to Netlify

1. **Go to [Netlify](https://netlify.com)**
   - Sign up or log in with GitHub
   - Click "Add new site" → "Import an existing project"

2. **Connect Repository**
   - Select your PeerUP repository
   - Netlify will auto-detect Next.js

3. **Build Settings**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Base directory:** (leave empty if root)

4. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all variables from `.env.local` (same as Vercel)

5. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete

### Step 3: Configure Next.js Plugin

Netlify requires a special plugin for Next.js:

1. **Create `netlify.toml` in project root:**
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

2. **Or install via Netlify UI:**
   - Go to Site settings → Plugins
   - Search for "Next.js" and install

### Step 4: Post-Deployment

1. **Update Firebase Authorized Domains**
   - Add your Netlify domain (e.g., `your-app.netlify.app`)

2. **Update NEXTAUTH_URL**
   - Set to your Netlify URL

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

