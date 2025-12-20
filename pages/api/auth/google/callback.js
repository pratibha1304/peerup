import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';

// Initialize Firebase for server-side (API routes)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

/**
 * Google OAuth Callback Handler
 * 
 * This endpoint handles the OAuth callback from Google after user authorization.
 * It exchanges the authorization code for access/refresh tokens and stores them.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=no_code`
    );
  }

  // Extract userId from state (we'll pass it in the OAuth URL)
  const userId = state;

  if (!userId) {
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=invalid_state`
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error('Token exchange error:', errorData);
      return res.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    
    // Calculate expiry date (tokens expire in 1 hour, but we'll refresh before that)
    const expiryDate = Date.now() + (tokenData.expires_in * 1000);

    // Store tokens in Firestore
    const tokensRef = doc(db, 'userCalendarTokens', userId);
    await setDoc(tokensRef, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiryDate,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Redirect back to settings with success
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?calendar_connected=true`
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?error=${encodeURIComponent(error.message)}`
    );
  }
}

