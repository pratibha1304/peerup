/**
 * User Recovery Script
 * 
 * This script helps recover a deleted user document by:
 * 1. Finding user references in other collections (matches, chats, callLogs, etc.)
 * 2. Extracting user data from Firebase Auth
 * 3. Reconstructing the user document
 * 
 * Usage:
 * 1. Get the user's email or UID
 * 2. Run this script with the email/UID
 * 3. Review the recovered data
 * 4. Manually recreate the document in Firestore Console
 */

import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getUserByEmail } from 'firebase/auth';

interface RecoveredUserData {
  uid: string;
  email: string;
  name: string;
  role?: 'mentor' | 'buddy' | 'mentee';
  profilePicUrl?: string;
  // Additional fields found in other collections
  foundInMatches?: boolean;
  foundInChats?: boolean;
  foundInCallLogs?: boolean;
  foundInMatchRequests?: boolean;
  foundInScheduleRequests?: boolean;
}

/**
 * Find user references across all collections
 */
export async function findUserReferences(userId: string): Promise<RecoveredUserData | null> {
  const recovered: Partial<RecoveredUserData> = {
    uid: userId,
    foundInMatches: false,
    foundInChats: false,
    foundInCallLogs: false,
    foundInMatchRequests: false,
    foundInScheduleRequests: false,
  };

  try {
    // Check matches collection
    const matchesRef = collection(db, 'matches');
    const matchesQuery = query(matchesRef, where('participants', 'array-contains', userId));
    const matchesSnapshot = await getDocs(matchesQuery);
    if (!matchesSnapshot.empty) {
      recovered.foundInMatches = true;
      console.log(`✓ Found user in ${matchesSnapshot.size} match(es)`);
    }

    // Check chats collection
    const chatsRef = collection(db, 'chats');
    const chatsQuery = query(chatsRef, where('participants', 'array-contains', userId));
    const chatsSnapshot = await getDocs(chatsQuery);
    if (!chatsSnapshot.empty) {
      recovered.foundInChats = true;
      console.log(`✓ Found user in ${chatsSnapshot.size} chat(s)`);
    }

    // Check callLogs collection
    const callLogsRef = collection(db, 'callLogs');
    const callLogsQuery = query(callLogsRef, where('participants', 'array-contains', userId));
    const callLogsSnapshot = await getDocs(callLogsQuery);
    if (!callLogsSnapshot.empty) {
      recovered.foundInCallLogs = true;
      console.log(`✓ Found user in ${callLogsSnapshot.size} call log(s)`);
    }

    // Check matchRequests collection (as requester)
    const matchRequestsRef = collection(db, 'matchRequests');
    const requesterQuery = query(matchRequestsRef, where('requesterId', '==', userId));
    const requesterSnapshot = await getDocs(requesterQuery);
    if (!requesterSnapshot.empty) {
      recovered.foundInMatchRequests = true;
      console.log(`✓ Found user as requester in ${requesterSnapshot.size} match request(s)`);
    }

    // Check matchRequests collection (as receiver)
    const receiverQuery = query(matchRequestsRef, where('receiverId', '==', userId));
    const receiverSnapshot = await getDocs(receiverQuery);
    if (!receiverSnapshot.empty) {
      recovered.foundInMatchRequests = true;
      console.log(`✓ Found user as receiver in ${receiverSnapshot.size} match request(s)`);
    }

    // Check scheduleRequests collection
    const scheduleRequestsRef = collection(db, 'scheduleRequests');
    const scheduleRequesterQuery = query(scheduleRequestsRef, where('requesterId', '==', userId));
    const scheduleRequesterSnapshot = await getDocs(scheduleRequesterQuery);
    if (!scheduleRequesterSnapshot.empty) {
      recovered.foundInScheduleRequests = true;
      console.log(`✓ Found user as requester in ${scheduleRequesterSnapshot.size} schedule request(s)`);
    }

    const scheduleReceiverQuery = query(scheduleRequestsRef, where('receiverId', '==', userId));
    const scheduleReceiverSnapshot = await getDocs(scheduleReceiverQuery);
    if (!scheduleReceiverSnapshot.empty) {
      recovered.foundInScheduleRequests = true;
      console.log(`✓ Found user as receiver in ${scheduleReceiverSnapshot.size} schedule request(s)`);
    }

    return recovered as RecoveredUserData;
  } catch (error) {
    console.error('Error finding user references:', error);
    return null;
  }
}

/**
 * Get user data from Firebase Auth
 */
export async function getUserFromAuth(emailOrUid: string): Promise<Partial<RecoveredUserData> | null> {
  try {
    // Try to get user by UID first
    let firebaseUser = null;
    
    // If it looks like an email, we'll need to search differently
    // Note: Firebase Admin SDK would be needed for email lookup
    // For now, we'll assume UID is provided
    
    // Get basic user info from Auth (if we have the UID)
    // This would require Firebase Admin SDK for full email lookup
    
    return {
      email: emailOrUid.includes('@') ? emailOrUid : 'unknown@example.com',
      name: 'Recovered User',
      role: 'buddy', // Default role
    };
  } catch (error) {
    console.error('Error getting user from Auth:', error);
    return null;
  }
}

/**
 * Reconstruct user document
 */
export async function reconstructUserDocument(
  userId: string,
  userEmail?: string
): Promise<void> {
  console.log(`\n🔍 Recovering user: ${userId}`);
  
  // Find references
  const references = await findUserReferences(userId);
  if (!references) {
    console.error('❌ Could not find any references to this user');
    return;
  }

  // Get basic info from Auth (if possible)
  const authData = userEmail ? await getUserFromAuth(userEmail) : null;

  // Construct minimal user document
  const recoveredUser = {
    uid: userId,
    email: userEmail || authData?.email || 'unknown@example.com',
    name: authData?.name || 'Recovered User',
    role: references.role || authData?.role || 'buddy',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    profilePicUrl: authData?.profilePicUrl || '',
    // Note: Other fields (skills, interests, etc.) cannot be recovered
    // User will need to update their profile manually
  };

  console.log('\n📋 Recovered User Data:');
  console.log(JSON.stringify(recoveredUser, null, 2));
  
  console.log('\n⚠️  IMPORTANT:');
  console.log('1. Review the recovered data above');
  console.log('2. Go to Firebase Console → Firestore → users collection');
  console.log('3. Create a new document with ID:', userId);
  console.log('4. Copy the recovered data into the document');
  console.log('5. The user will need to update their profile (skills, interests, etc.) manually');
  
  // Optionally, you can uncomment this to auto-create the document:
  // try {
  //   await setDoc(doc(db, 'users', userId), recoveredUser);
  //   console.log('\n✅ User document recreated successfully!');
  // } catch (error) {
  //   console.error('❌ Error recreating document:', error);
  //   console.log('Please recreate manually in Firebase Console');
  // }
}

// Example usage (uncomment and modify):
// reconstructUserDocument('USER_UID_HERE', 'user@example.com');

