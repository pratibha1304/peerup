// Use client-side Firebase SDK instead of firebase-admin
// This requires the user to be authenticated, so this endpoint should be protected
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Note: This approach requires proper authentication
// For server-side operations, you'd need firebase-admin with service account credentials
// For now, we'll make this endpoint return an error explaining the limitation

// This endpoint requires firebase-admin for server-side operations
// Since we're using client SDK, this migration should be run client-side
// or firebase-admin needs to be installed with proper credentials
async function getUserName(userId, db) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      return userData.name || userData.displayName || 'Unknown User';
    }
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
  }
  return 'Unknown User';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // This endpoint requires firebase-admin for server-side bulk operations
  // For now, return an error directing users to use the client-side migration tool
  return res.status(501).json({ 
    error: 'Server-side migration requires firebase-admin. Please use the client-side migration tool at /dashboard/admin/add-names or install firebase-admin with proper service account credentials.',
    alternative: 'Use the browser-based migration tool which runs client-side'
  });
}

