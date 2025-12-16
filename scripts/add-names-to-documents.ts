/**
 * Migration script to add user names to existing documents
 * Run this script to update existing documents in Firestore with user names
 * 
 * Usage:
 *   npx ts-node scripts/add-names-to-documents.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getUserName(userId: string): Promise<string> {
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

async function updateMatchRequests() {
  console.log('📝 Updating matchRequests...');
  const matchRequestsRef = collection(db, 'matchRequests');
  const snapshot = await getDocs(matchRequestsRef);
  
  let updated = 0;
  let skipped = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const needsUpdate = !data.requesterName || !data.receiverName;
    
    if (needsUpdate) {
      try {
        const requesterName = await getUserName(data.requesterId);
        const receiverName = await getUserName(data.receiverId);
        
        await updateDoc(doc(db, 'matchRequests', docSnap.id), {
          requesterName,
          receiverName,
        });
        
        updated++;
        console.log(`  ✅ Updated ${docSnap.id}: ${requesterName} -> ${receiverName}`);
      } catch (error) {
        console.error(`  ❌ Error updating ${docSnap.id}:`, error);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ Match Requests: ${updated} updated, ${skipped} skipped\n`);
}

async function updateCallRooms() {
  console.log('📞 Updating callRooms...');
  const callRoomsRef = collection(db, 'callRooms');
  const snapshot = await getDocs(callRoomsRef);
  
  let updated = 0;
  let skipped = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const needsUpdate = !data.callerName || !data.calleeName;
    
    if (needsUpdate && data.callerId && data.calleeId) {
      try {
        const callerName = await getUserName(data.callerId);
        const calleeName = await getUserName(data.calleeId);
        
        await updateDoc(doc(db, 'callRooms', docSnap.id), {
          callerName,
          calleeName,
        });
        
        updated++;
        console.log(`  ✅ Updated ${docSnap.id}: ${callerName} -> ${calleeName}`);
      } catch (error) {
        console.error(`  ❌ Error updating ${docSnap.id}:`, error);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ Call Rooms: ${updated} updated, ${skipped} skipped\n`);
}

async function updateCallLogs() {
  console.log('📋 Updating callLogs...');
  const callLogsRef = collection(db, 'callLogs');
  const snapshot = await getDocs(callLogsRef);
  
  let updated = 0;
  let skipped = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const needsUpdate = !data.callerName || !data.calleeName;
    
    if (needsUpdate && data.callerId && data.calleeId) {
      try {
        const callerName = await getUserName(data.callerId);
        const calleeName = await getUserName(data.calleeId);
        
        await updateDoc(doc(db, 'callLogs', docSnap.id), {
          callerName,
          calleeName,
        });
        
        updated++;
        console.log(`  ✅ Updated ${docSnap.id}: ${callerName} -> ${calleeName}`);
      } catch (error) {
        console.error(`  ❌ Error updating ${docSnap.id}:`, error);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ Call Logs: ${updated} updated, ${skipped} skipped\n`);
}

async function updateMatches() {
  console.log('🤝 Updating matches...');
  const matchesRef = collection(db, 'matches');
  const snapshot = await getDocs(matchesRef);
  
  let updated = 0;
  let skipped = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const needsUpdate = !data.participantNames || data.participantNames.length !== data.participants?.length;
    
    if (needsUpdate && data.participants && data.participants.length > 0) {
      try {
        const participantNames = await Promise.all(
          data.participants.map((uid: string) => getUserName(uid))
        );
        
        await updateDoc(doc(db, 'matches', docSnap.id), {
          participantNames,
        });
        
        updated++;
        console.log(`  ✅ Updated ${docSnap.id}: ${participantNames.join(', ')}`);
      } catch (error) {
        console.error(`  ❌ Error updating ${docSnap.id}:`, error);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ Matches: ${updated} updated, ${skipped} skipped\n`);
}

async function updateChats() {
  console.log('💬 Updating chats...');
  const chatsRef = collection(db, 'chats');
  const snapshot = await getDocs(chatsRef);
  
  let updated = 0;
  let skipped = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const needsUpdate = !data.participantNames || data.participantNames.length !== data.participants?.length;
    
    if (needsUpdate && data.participants && data.participants.length > 0) {
      try {
        const participantNames = await Promise.all(
          data.participants.map((uid: string) => getUserName(uid))
        );
        
        await updateDoc(doc(db, 'chats', docSnap.id), {
          participantNames,
        });
        
        updated++;
        console.log(`  ✅ Updated ${docSnap.id}: ${participantNames.join(', ')}`);
      } catch (error) {
        console.error(`  ❌ Error updating ${docSnap.id}:`, error);
      }
    } else {
      skipped++;
    }
  }
  
  console.log(`✅ Chats: ${updated} updated, ${skipped} skipped\n`);
}

async function main() {
  console.log('🚀 Starting migration to add user names to documents...\n');
  
  try {
    await updateMatchRequests();
    await updateCallRooms();
    await updateCallLogs();
    await updateMatches();
    await updateChats();
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

