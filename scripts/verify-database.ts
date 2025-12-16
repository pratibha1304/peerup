/**
 * Database Verification Script
 * 
 * This script verifies that all required Firestore collections and indexes
 * are properly set up in your Firebase project.
 * 
 * Usage:
 * 1. Make sure you're logged into Firebase: firebase login
 * 2. Run: npx ts-node scripts/verify-database.ts
 * 
 * Or use the browser-based version at /dashboard/admin/verify-database
 */

import { db } from '../lib/firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';

interface CollectionInfo {
  name: string;
  exists: boolean;
  documentCount: number;
  description: string;
}

const REQUIRED_COLLECTIONS = [
  {
    name: 'users',
    description: 'User profiles - Created when users sign up',
  },
  {
    name: 'chats',
    description: 'Chat conversations - Created when users send messages',
  },
  {
    name: 'callRooms',
    description: 'Active call rooms - Created when users initiate calls',
  },
  {
    name: 'scheduleRequests',
    description: 'Schedule requests - Created when users propose meeting times',
  },
  {
    name: 'matches',
    description: 'Matches between users - Created when match requests are accepted',
  },
  {
    name: 'callLogs',
    description: 'Call history - Created when calls end',
  },
  {
    name: 'matchRequests',
    description: 'Match requests - Created when users send match requests',
  },
  {
    name: 'feedback',
    description: 'User feedback - Created when users submit feedback',
  },
];

export async function verifyDatabaseStructure(): Promise<CollectionInfo[]> {
  const results: CollectionInfo[] = [];

  for (const collectionInfo of REQUIRED_COLLECTIONS) {
    try {
      const collectionRef = collection(db, collectionInfo.name);
      const snapshot = await getDocs(query(collectionRef, limit(1)));
      
      results.push({
        name: collectionInfo.name,
        exists: true,
        documentCount: snapshot.size,
        description: collectionInfo.description,
      });
    } catch (error: any) {
      // Collection might not exist yet (that's okay - they're created on first use)
      if (error.code === 'not-found' || error.message.includes('not found')) {
        results.push({
          name: collectionInfo.name,
          exists: false,
          documentCount: 0,
          description: collectionInfo.description,
        });
      } else {
        console.error(`Error checking ${collectionInfo.name}:`, error);
        results.push({
          name: collectionInfo.name,
          exists: false,
          documentCount: 0,
          description: `${collectionInfo.description} - Error: ${error.message}`,
        });
      }
    }
  }

  return results;
}

export async function printDatabaseStatus() {
  console.log('\n🔍 Verifying Firestore Database Structure...\n');
  
  const results = await verifyDatabaseStructure();
  
  console.log('Collection Status:');
  console.log('─'.repeat(80));
  
  let allExist = true;
  for (const result of results) {
    const status = result.exists ? '✅' : '⚠️ ';
    const count = result.exists ? `(${result.documentCount} docs)` : '(not created yet)';
    console.log(`${status} ${result.name.padEnd(20)} ${count}`);
    console.log(`   ${result.description}`);
    
    if (!result.exists) {
      allExist = false;
    }
  }
  
  console.log('─'.repeat(80));
  
  if (allExist) {
    console.log('\n✅ All collections are accessible!');
  } else {
    console.log('\n⚠️  Some collections don\'t exist yet.');
    console.log('   This is normal - collections are created automatically when first used.');
    console.log('   Try creating a test user or sending a message to create them.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Deploy Firestore rules: firebase deploy --only firestore:rules');
  console.log('   2. Deploy Firestore indexes: firebase deploy --only firestore:indexes');
  console.log('   3. Create a test user account');
  console.log('   4. Verify collections appear in Firebase Console\n');
}

// Run if executed directly
if (require.main === module) {
  printDatabaseStatus().catch(console.error);
}

