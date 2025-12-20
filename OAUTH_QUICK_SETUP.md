# Quick OAuth Setup Instructions

## What to Add in Google Cloud Console

When you see the "Create OAuth client ID" page, add these URIs:

### Authorized JavaScript origins:
Click "+ Add URI" and add:
- `http://localhost:3000` (for local development)
- `https://your-production-domain.com` (replace with your actual Netlify/Vercel domain)

### Authorized redirect URIs:
Click "+ Add URI" and add:
- `http://localhost:3000/api/auth/google/callback` (for local)
- `https://your-production-domain.com/api/auth/google/callback` (for production)

**Important Notes:**
- Use `http://` for localhost
- Use `https://` for production
- No trailing slashes
- Exact match required (case-sensitive)

### Example for Netlify:
If your site is `https://peerup-app.netlify.app`, add:
- JavaScript origin: `https://peerup-app.netlify.app`
- Redirect URI: `https://peerup-app.netlify.app/api/auth/google/callback`

### After Creating:
1. Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
2. Copy the **Client Secret** (looks like: `GOCSPX-abc123...`)
3. Add them to your `.env.local` and Netlify environment variables

